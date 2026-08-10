require("dotenv").config();
const MailChecker = require("mailchecker");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const PendingPayment = require("../models/PendingPayment");
const { sendEmail } = require("../lib/email-sender/sender");
const customerInvoiceEmailBody = require("../lib/email-sender/templates/order-to-customer");
const { handleCreateInvoice } = require("../lib/email-sender/create");
const {
  calculateOrderTotals,
} = require("../lib/order/calculateOrderTotals");

const PaymentService = require("../services/payment/PaymentService");
const PaymentVerificationService = require("../services/payment/PaymentVerificationService");
const PaymentWebhookService = require("../services/payment/PaymentWebhookService");
const PaymentCallbackService = require("../services/payment/PaymentCallbackService");
const PendingOrderExpiryService = require("../services/payment/PendingOrderExpiryService");
const OrderService = require("../services/order/OrderService");
const PhonePeService = require("../services/payment/PhonePeService");
const Setting = require("../models/Setting");

/** Masked PhonePe runtime config — used to verify production env after deploy */
const phonePeHealth = async (_req, res) => {
  try {
    const cfg = PhonePeService.getConfig();
    const mask = (v) =>
      !v ? "(empty)" : `${String(v).slice(0, 4)}…${String(v).slice(-4)}`;
    return res.status(200).send({
      ok: true,
      env: cfg.env,
      merchantId: cfg.merchantId || "(empty)",
      clientId: cfg.clientId,
      clientVersion: cfg.clientVersion,
      clientSecret: mask(cfg.clientSecret),
      authBaseUrl: cfg.authBaseUrl,
      pgBaseUrl: cfg.pgBaseUrl,
      publicApiUrl: process.env.PUBLIC_API_URL || "(unset)",
      storeUrl: process.env.STORE_URL || "(unset)",
      mockMode: process.env.PHONEPE_MOCK_MODE === "true",
      saltKeySet: Boolean(process.env.PHONEPE_SALT_KEY),
    });
  } catch (err) {
    return res.status(500).send({ ok: false, message: err.message });
  }
};

/** COD */
const addOrder = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).send({ message: "Authentication required." });
    }

    const storeSetting = await Setting.findOne({ name: "storeSetting" }).lean();
    if (storeSetting?.setting?.cod_status === false) {
      return res.status(403).send({
        message:
          "Cash on Delivery is currently unavailable. Please pay online with PhonePe.",
      });
    }

    const { cart, user_info, shippingOption, couponCode, discount } =
      req.body || {};

    const totals = await calculateOrderTotals({
      cart,
      couponCode,
      shippingOption,
      discount,
    });

    const order = await OrderService.createCashOrder({
      userId: req.user._id,
      orderPayload: {
        user_info,
        cart: totals.cart,
        subTotal: totals.subTotal,
        shippingCost: totals.shippingCost,
        discount: totals.discount,
        total: totals.total,
        shippingOption: totals.shippingOption,
      },
    });

    res.status(201).send(order);
  } catch (err) {
    res.status(err.message?.includes("cart") ? 400 : 500).send({
      message: err.message,
    });
  }
};

/** Create pending order + PhonePe V2 redirect */
const createPhonePePayment = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).send({ message: "Authentication required." });
    }

    const result = await PaymentService.createPhonePeCheckout({
      req,
      body: req.body,
    });

    return res.status(200).send(result);
  } catch (err) {
    console.error("[Payment][Create] error:", err?.details || err.message);
    return res.status(err.status || 400).send({
      message: err.message || "Failed to initiate PhonePe payment",
      error: err.details || undefined,
    });
  }
};

/** Browser callback — UI redirect only after backend Status API verify */
const phonePeCallback = async (req, res) => {
  try {
    const { redirectUrl } = await PaymentCallbackService.handle(req);
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("[Payment][Callback] error:", err.message);
    try {
      const CallbackSecurity = require("../services/payment/CallbackSecurity");
      const base = CallbackSecurity.getFrontendBaseUrl(req);
      return res.redirect(
        `${base}/checkout?error=payment_error&msg=${encodeURIComponent(
          err.message || "Payment processing error"
        )}`
      );
    } catch {
      return res.status(400).send({ message: err.message });
    }
  }
};

/** S2S webhook */
const phonePeWebhook = async (req, res) => {
  try {
    const rawBody =
      typeof req.rawBody === "string"
        ? req.rawBody
        : JSON.stringify(req.body || {});

    const outcome = await PaymentWebhookService.handleWebhook({
      headers: req.headers,
      body: req.body,
      rawBody,
    });

    return res.status(200).send({
      success: true,
      message: "Webhook processed",
      ...outcome,
    });
  } catch (err) {
    console.error("[Payment][Webhook] error:", err.message);
    return res.status(err.status || 200).send({
      success: false,
      message: err.message,
    });
  }
};

/** Manual verify — still Status API only */
const verifyPhonePePayment = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).send({ message: "Authentication required." });
    }

    const merchantOrderId =
      req.body?.merchantOrderId || req.body?.merchantTransactionId;

    if (!merchantOrderId) {
      return res.status(400).send({ message: "merchantOrderId is required" });
    }

    const payment = await PendingPayment.findOne({
      $or: [
        { merchantOrderId },
        { merchantTransactionId: merchantOrderId },
      ],
    });

    if (
      payment?.user &&
      String(payment.user) !== String(req.user._id) &&
      req.user.type !== "admin"
    ) {
      return res.status(403).send({ message: "Not authorized." });
    }

    const result = await PaymentVerificationService.verifyAndFulfill(
      merchantOrderId,
      { source: "api-verify" }
    );

    if (result.success) {
      return res.status(200).send({
        success: true,
        order: result.order,
        duplicate: result.duplicate || false,
      });
    }

    return res.status(400).send({
      success: false,
      pending: result.pending || false,
      message:
        result.normalized?.failureReason ||
        "Payment not verified as successful",
      state: result.normalized?.state,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

/** Cron / scheduled: expire unpaid pending PhonePe orders */
const expirePendingPayments = async (req, res) => {
  try {
    const secret = process.env.CRON_SECRET;
    const provided =
      req.headers["x-cron-secret"] ||
      req.query.secret ||
      req.headers.authorization?.replace(/^Bearer\s+/i, "");

    if (secret && provided !== secret) {
      return res.status(401).send({ message: "Unauthorized cron request" });
    }

    const result = await PendingOrderExpiryService.run();
    return res.status(200).send({ success: true, ...result });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

const phonePeMockCheckout = async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).send({ message: "Not Found" });
  }

  try {
    const merchantOrderId = req.query.merchantOrderId || req.query.txId;
    const pendingPayment = await PendingPayment.findOne({
      $or: [
        { merchantOrderId },
        { merchantTransactionId: merchantOrderId },
      ],
    });
    if (!pendingPayment) {
      return res.status(404).send("Invalid or expired payment transaction.");
    }

    const amountFormatted = (pendingPayment.amount || 0).toLocaleString(
      "en-IN",
      { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    );

    const html = `<!DOCTYPE html>
<html><head><title>PhonePe Mock Checkout</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body{font-family:system-ui,sans-serif;background:#f4f5f8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#fff;padding:32px;border-radius:16px;max-width:420px;width:90%;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.08)}
.btn{display:block;width:100%;padding:14px;border:0;border-radius:10px;font-weight:700;margin:8px 0;cursor:pointer}
.ok{background:#5f259f;color:#fff}.no{background:#e5e7eb;color:#374151}
</style></head><body><div class="card">
<h2>Elecmoon Mock Gateway</h2>
<p style="font-size:28px;font-weight:800;margin:8px 0">₹${amountFormatted}</p>
<p style="font-size:12px;color:#6b7280;word-break:break-all">${merchantOrderId}</p>
<button class="btn ok" onclick="location.href='/api/order/phonepe/callback?merchantOrderId=${encodeURIComponent(
      merchantOrderId
    )}&status=SUCCESS'">Simulate Success</button>
<button class="btn no" onclick="location.href='/api/order/phonepe/callback?merchantOrderId=${encodeURIComponent(
      merchantOrderId
    )}&status=FAILED'">Simulate Cancel</button>
</div></body></html>`;

    res.send(html);
  } catch (err) {
    res.status(500).send("Error rendering mock checkout: " + err.message);
  }
};

const getOrderCustomer = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const pages = Number(page) || 1;
    const limits = Number(limit) || 8;
    const skip = (pages - 1) * limits;

    const totalDoc = await Order.countDocuments({ user: req.user._id });

    const totalPendingOrder = await Order.aggregate([
      {
        $match: {
          status: "Pending",
          user: mongoose.Types.ObjectId(req.user._id),
        },
      },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]);

    const totalProcessingOrder = await Order.aggregate([
      {
        $match: {
          status: "Processing",
          user: mongoose.Types.ObjectId(req.user._id),
        },
      },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]);

    const totalDeliveredOrder = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          user: mongoose.Types.ObjectId(req.user._id),
        },
      },
      { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
    ]);

    const orders = await Order.find({ user: req.user._id })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limits);

    res.send({
      orders,
      limits,
      pages,
      pending: totalPendingOrder.length === 0 ? 0 : totalPendingOrder[0].count,
      processing:
        totalProcessingOrder.length === 0 ? 0 : totalProcessingOrder[0].count,
      delivered:
        totalDeliveredOrder.length === 0 ? 0 : totalDeliveredOrder[0].count,
      totalDoc,
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).send({ message: "Order not found." });
    }
    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).send({
        message: "You are not authorized to view this order.",
      });
    }
    res.send(order);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const sendEmailInvoiceToCustomer = async (req, res) => {
  try {
    const user = req.body.user_info;
    const isAdmin = req.user?.type === "admin";

    if (!isAdmin) {
      if (
        !user?.email ||
        String(user.email).toLowerCase() !== String(req.user.email).toLowerCase()
      ) {
        return res.status(403).send({
          message: "You can only send invoices to your own email address.",
        });
      }
      if (req.body?._id) {
        const order = await Order.findById(req.body._id);
        if (!order || String(order.user) !== String(req.user._id)) {
          return res.status(403).send({
            message: "You are not authorized to send this invoice.",
          });
        }
      }
    }

    if (!MailChecker.isValid(user?.email)) {
      return res.status(400).send({
        message:
          "Invalid or disposable email address. Please provide a valid email.",
      });
    }

    const pdf = await handleCreateInvoice(req.body, `${req.body.invoice}.pdf`);
    const option = {
      date: req.body.date,
      invoice: req.body.invoice,
      status: req.body.status,
      method: req.body.paymentMethod,
      subTotal: req.body.subTotal,
      total: req.body.total,
      discount: req.body.discount,
      shipping: req.body.shippingCost,
      currency: req.body.company_info.currency,
      company_name: req.body.company_info.company,
      company_address: req.body.company_info.address,
      company_phone: req.body.company_info.phone,
      company_email: req.body.company_info.email,
      company_website: req.body.company_info.website,
      vat_number: req.body?.company_info?.vat_number,
      name: user?.name,
      email: user?.email,
      phone: user?.phone,
      address: user?.address,
      cart: req.body.cart,
    };

    const body = {
      from: req.body.company_info?.from_email || "sales@Elecmoon.com",
      to: user.email,
      subject: `Your Order - ${req.body.invoice} at ${req.body.company_info.company}`,
      html: customerInvoiceEmailBody(option),
      attachments: [
        { filename: `${req.body.invoice}.pdf`, content: pdf },
      ],
    };
    sendEmail(body, res, `Invoice successfully sent to the customer ${user.name}`);
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const createPaymentIntent = (_req, res) =>
  res.status(410).send({ message: "Stripe payments have been removed. Use PhonePe." });
const createOrderByRazorPay = (_req, res) =>
  res.status(410).send({ message: "Razorpay has been removed. Use PhonePe." });
const addRazorpayOrder = (_req, res) =>
  res.status(410).send({ message: "Razorpay has been removed. Use PhonePe." });
const verifyRazorpayPaymentAndAddOrder = (_req, res) =>
  res.status(410).send({ message: "Razorpay has been removed. Use PhonePe." });

module.exports = {
  addOrder,
  getOrderById,
  getOrderCustomer,
  createPaymentIntent,
  createOrderByRazorPay,
  addRazorpayOrder,
  verifyRazorpayPaymentAndAddOrder,
  sendEmailInvoiceToCustomer,
  createPhonePePayment,
  phonePeCallback,
  phonePeWebhook,
  verifyPhonePePayment,
  phonePeMockCheckout,
  expirePendingPayments,
  phonePeHealth,
};
