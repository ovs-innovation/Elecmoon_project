require("dotenv").config();
const stripe = require("stripe");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const MailChecker = require("mailchecker");

const mongoose = require("mongoose");

const Order = require("../models/Order");
const Setting = require("../models/Setting");
const { sendEmail } = require("../lib/email-sender/sender");
const { formatAmountForStripe } = require("../lib/stripe/stripe");
const customerInvoiceEmailBody = require("../lib/email-sender/templates/order-to-customer");
const { handleCreateInvoice } = require("../lib/email-sender/create");
const {
  queueOrderInvoiceEmail,
} = require("../lib/email-sender/sendOrderInvoiceEmail");
const { queueOrderNotificationEmail } = require("../lib/email-sender/adminNotificationEmail");
const { handleProductQuantity } = require("../lib/stock-controller/others");
const {
  calculateOrderTotals,
  roundMoney,
} = require("../lib/order/calculateOrderTotals");

const generateOrderId = () =>
  "ORD-" + crypto.randomBytes(4).toString("hex").toUpperCase();

const getRazorpayCredentials = async () => {
  const razorpayKeyIdEnv = process.env.RAZORPAY_KEY_ID;
  const razorpaySecretEnv = process.env.RAZORPAY_KEY_SECRET;

  const storeSetting =
    !razorpayKeyIdEnv || !razorpaySecretEnv
      ? await Setting.findOne({ name: "storeSetting" })
      : null;

  const key_id = razorpayKeyIdEnv || storeSetting?.setting?.razorpay_id;
  const key_secret =
    razorpaySecretEnv || storeSetting?.setting?.razorpay_secret;

  return { key_id, key_secret };
};

const buildOrderPayload = async (req, { paymentMethod, status }) => {
  const {
    cart,
    user_info,
    shippingOption,
    couponCode,
    discount,
  } = req.body || {};

  const totals = await calculateOrderTotals({
    cart,
    couponCode,
    shippingOption,
    discount,
  });

  return {
    user_info,
    cart: totals.cart,
    subTotal: totals.subTotal,
    shippingCost: totals.shippingCost,
    discount: totals.discount,
    total: totals.total,
    shippingOption: totals.shippingOption,
    paymentMethod,
    status,
    user: req.user._id,
    orderId: req.body?.orderId || generateOrderId(),
  };
};

const addOrder = async (req, res) => {
  try {
    const orderPayload = await buildOrderPayload(req, {
      paymentMethod: "Cash",
      status: "Pending",
    });

    const newOrder = new Order(orderPayload);
    const order = await newOrder.save();
    await handleProductQuantity(order.cart);
    res.status(201).send(order);
    queueOrderInvoiceEmail(order);
    queueOrderNotificationEmail(order);
  } catch (err) {
    res.status(err.message?.includes("cart") ? 400 : 500).send({
      message: err.message,
    });
  }
};

const createPaymentIntent = async (req, res) => {
  try {
    const totals = await calculateOrderTotals({
      cart: req.body?.cart || [],
      couponCode: req.body?.couponCode,
      shippingOption: req.body?.shippingOption,
      discount: req.body?.discount,
    });
    const amount = totals.total;
    const { cardInfo: existingPaymentIntent } = req.body;

    if (!(amount >= process.env.MIN_AMOUNT && amount <= process.env.MAX_AMOUNT)) {
      return res.status(500).json({ message: "Invalid amount." });
    }

    const storeSetting = await Setting.findOne({ name: "storeSetting" });
    const stripeSecret = storeSetting?.setting?.stripe_secret;
    const stripeInstance = stripe(stripeSecret);

    if (existingPaymentIntent?.id) {
      try {
        const current_intent = await stripeInstance.paymentIntents.retrieve(
          existingPaymentIntent.id
        );
        if (current_intent) {
          const updated_intent = await stripeInstance.paymentIntents.update(
            existingPaymentIntent.id,
            {
              amount: formatAmountForStripe(amount, "usd"),
            }
          );
          return res.send(updated_intent);
        }
      } catch (err) {
        if (err.code !== "resource_missing") {
          const errorMessage =
            err instanceof Error ? err.message : "Internal server error";
          return res.status(500).send({ message: errorMessage });
        }
      }
    }

    const params = {
      amount: formatAmountForStripe(amount, "usd"),
      currency: "usd",
      description: process.env.STRIPE_PAYMENT_DESCRIPTION || "",
      automatic_payment_methods: {
        enabled: true,
      },
    };
    const newPaymentIntent = await stripeInstance.paymentIntents.create(params);
    res.send(newPaymentIntent);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Internal server error";
    res.status(500).send({ message: errorMessage });
  }
};

const createOrderByRazorPay = async (req, res) => {
  try {
    const { key_id, key_secret } = await getRazorpayCredentials();

    if (!key_id || !key_secret) {
      return res.status(500).send({
        message:
          "Razorpay credentials not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend .env.",
      });
    }

    const totals = await calculateOrderTotals({
      cart: req.body?.cart || [],
      couponCode: req.body?.couponCode,
      shippingOption: req.body?.shippingOption,
      discount: req.body?.discount,
    });

    const instance = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: Math.round(totals.total * 100),
      currency: "INR",
    };
    const order = await instance.orders.create(options);

    if (!order) {
      return res.status(500).send({
        message: "Error occurred when creating order!",
      });
    }

    res.send({
      ...order,
      calculatedTotal: totals.total,
    });
  } catch (err) {
    res.status(err.message?.includes("cart") ? 400 : 500).send({
      message: err.message,
    });
  }
};

const addRazorpayOrder = async (_req, res) => {
  return res.status(410).send({
    message:
      "This endpoint is disabled. Complete payment and use /order/verify/razorpay instead.",
  });
};

const verifyRazorpaySignature = (secret, orderId, paymentId, signature) => {
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const generatedBuffer = Buffer.from(generatedSignature, "hex");
  const providedBuffer = Buffer.from(signature, "hex");

  if (generatedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(generatedBuffer, providedBuffer);
};

const verifyRazorpayPaymentAndAddOrder = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      cart,
      user_info,
      shippingOption,
      couponCode,
      discount,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).send({
        message:
          "Missing Razorpay payment details (order_id/payment_id/signature).",
      });
    }

    const existingOrder = await Order.findOne({
      razorpayPaymentId: razorpay_payment_id,
    });
    if (existingOrder) {
      return res.status(200).send(existingOrder);
    }

    const { key_id, key_secret } = await getRazorpayCredentials();
    if (!key_secret) {
      return res.status(500).send({
        message:
          "Razorpay secret not configured. Add RAZORPAY_KEY_SECRET to backend .env.",
      });
    }

    if (
      !verifyRazorpaySignature(
        key_secret,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      )
    ) {
      return res.status(400).send({
        message: "Invalid Razorpay signature.",
      });
    }

    const totals = await calculateOrderTotals({
      cart,
      couponCode,
      shippingOption,
      discount,
    });

    const instance = new Razorpay({
      key_id,
      key_secret,
    });
    const razorpayOrder = await instance.orders.fetch(razorpay_order_id);
    const paidAmount = roundMoney(Number(razorpayOrder.amount) / 100);

    if (paidAmount !== totals.total) {
      return res.status(400).send({
        message: "Payment amount does not match the calculated order total.",
      });
    }

    const newOrder = new Order({
      user_info,
      cart: totals.cart,
      subTotal: totals.subTotal,
      shippingCost: totals.shippingCost,
      discount: totals.discount,
      total: totals.total,
      shippingOption: totals.shippingOption,
      user: req.user._id,
      orderId: req.body?.orderId || generateOrderId(),
      paymentMethod: "Razorpay",
      status: "Processing",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
    });

    const order = await newOrder.save();
    await handleProductQuantity(order.cart);
    queueOrderInvoiceEmail(order);
    queueOrderNotificationEmail(order);

    res.status(201).send(order);
  } catch (err) {
    res.status(err.message?.includes("cart") ? 400 : 500).send({
      message: err.message,
    });
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
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const totalProcessingOrder = await Order.aggregate([
      {
        $match: {
          status: "Processing",
          user: mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: {
            $sum: 1,
          },
        },
      },
    ]);

    const totalDeliveredOrder = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
          user: mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          count: {
            $sum: 1,
          },
        },
      },
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
    res.status(500).send({
      message: err.message,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).send({
        message: "Order not found.",
      });
    }

    if (String(order.user) !== String(req.user._id)) {
      return res.status(403).send({
        message: "You are not authorized to view this order.",
      });
    }

    res.send(order);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
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
        {
          filename: `${req.body.invoice}.pdf`,
          content: pdf,
        },
      ],
    };
    const message = `Invoice successfully sent to the customer ${user.name}`;
    sendEmail(body, res, message);
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

const PendingPayment = require("../models/PendingPayment");
const axios = require("axios");

const getPhonePeConfig = () => {
  const merchantId = process.env.PHONEPE_MERCHANT_ID || "SU2607281208295158372867";
  const saltKey = process.env.PHONEPE_SALT_KEY || "7b298a23-787d-4909-9ee6-a5fcb8d5711e";
  const saltIndex = process.env.PHONEPE_SALT_INDEX || "1";
  const hostUrl = process.env.PHONEPE_HOST_URL || "https://api.phonepe.com/apis/hermes";
  return { merchantId, saltKey, saltIndex, hostUrl };
};

/**
 * Idempotent PhonePe Order Processor
 * Ensures order is created ONCE only, inventory decremented ONCE only,
 * and email sent ONCE only even if callback & webhook hit simultaneously.
 */
const processPhonePeSuccessPayment = async ({
  merchantTransactionId,
  phonepeTransactionId,
  responseCode,
}) => {
  // 1. Idempotency Check: if order already created for this merchantTransactionId, return existing order
  const existingOrder = await Order.findOne({
    phonepeMerchantTransactionId: merchantTransactionId,
  });
  if (existingOrder) {
    console.log(`[PhonePe Idempotency] Order already processed for txId: ${merchantTransactionId}`);
    return existingOrder;
  }

  // 2. Find pending payment payload
  const pendingPayment = await PendingPayment.findOne({ merchantTransactionId });
  if (!pendingPayment) {
    throw new Error(`Pending payment session not found for txId: ${merchantTransactionId}`);
  }

  // 3. Mark pending payment as SUCCESS
  pendingPayment.status = "SUCCESS";
  pendingPayment.phonepeTransactionId = phonepeTransactionId || "";
  await pendingPayment.save();

  // 4. Extract saved order payload
  const {
    user_info,
    cart,
    subTotal,
    shippingCost,
    discount,
    total,
    shippingOption,
  } = pendingPayment.orderPayload;

  // 5. Create final Order record with status: "Processing"
  const newOrder = new Order({
    user_info,
    cart,
    subTotal,
    shippingCost,
    discount,
    total,
    shippingOption,
    user: pendingPayment.user,
    orderId: generateOrderId(),
    paymentMethod: "PhonePe",
    status: "Processing",
    phonepeMerchantTransactionId: merchantTransactionId,
    phonepeTransactionId: phonepeTransactionId || "",
    phonepeResponseCode: responseCode || "PAYMENT_SUCCESS",
  });

  const order = await newOrder.save();

  // 6. Decrement inventory & send confirmation emails (only after verified success)
  await handleProductQuantity(order.cart);
  queueOrderInvoiceEmail(order);
  queueOrderNotificationEmail(order);

  console.log(`[PhonePe Order Success] Order ${order.orderId} created successfully for txId: ${merchantTransactionId}`);
  return order;
};

/**
 * Initiate PhonePe Standard Payment
 */
const createPhonePePayment = async (req, res) => {
  try {
    const { cart, user_info, shippingOption, couponCode, discount } = req.body || {};

    const totals = await calculateOrderTotals({
      cart,
      couponCode,
      shippingOption,
      discount,
    });

    const merchantTransactionId = `MT_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const orderPayloadBase = {
      user_info,
      cart: totals.cart,
      subTotal: totals.subTotal,
      shippingCost: totals.shippingCost,
      discount: totals.discount,
      total: totals.total,
      shippingOption: totals.shippingOption,
    };

    const userId = req.user?._id || null;
    const merchantUserId = userId ? userId.toString() : `GUEST_${Date.now()}`;

    // Store pending payment session
    await PendingPayment.create({
      merchantTransactionId,
      user: userId,
      orderPayload: orderPayloadBase,
      amount: totals.total,
      status: "PENDING",
    });

    const { merchantId, saltKey, saltIndex, hostUrl } = getPhonePeConfig();

    const reqProtocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
    const hostHeader = req.headers["x-forwarded-host"] || req.headers.host;
    const backendBaseUrl = `${reqProtocol}://${hostHeader}`;

    // If PHONEPE_MOCK_MODE is enabled in .env, redirect to simulated checkout page for local testing
    if (process.env.PHONEPE_MOCK_MODE === "true") {
      return res.status(200).send({
        success: true,
        redirectUrl: `${backendBaseUrl}/api/order/phonepe/mock-checkout?txId=${merchantTransactionId}`,
        merchantTransactionId,
      });
    }

    const payloadObj = {
      merchantId,
      merchantTransactionId,
      merchantUserId,
      amount: Math.round(totals.total * 100), // amount in paise
      redirectUrl: `${backendBaseUrl}/api/order/phonepe/callback?txId=${merchantTransactionId}`,
      redirectMode: "POST",
      callbackUrl: `${backendBaseUrl}/api/order/phonepe/webhook`,
      mobileNumber: user_info?.phoneNumber?.replace(/\D/g, "")?.slice(-10) || "9999999999",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const base64Payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64");
    const stringToSign = base64Payload + "/pg/v1/pay" + saltKey;
    const checksum =
      crypto.createHash("sha256").update(stringToSign).digest("hex") +
      "###" +
      saltIndex;

    const phonepeRes = await axios.post(
      `${hostUrl}/pg/v1/pay`,
      { request: base64Payload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
        },
      }
    );

    if (
      phonepeRes.data?.success &&
      phonepeRes.data?.data?.instrumentResponse?.redirectInfo?.url
    ) {
      return res.status(200).send({
        success: true,
        redirectUrl: phonepeRes.data.data.instrumentResponse.redirectInfo.url,
        merchantTransactionId,
      });
    } else {
      return res.status(400).send({
        message: phonepeRes.data?.message || "Failed to initiate PhonePe payment",
      });
    }
  } catch (err) {
    const errorDetails = err?.response?.data;
    console.error("Error creating PhonePe payment:", errorDetails || err.message);

    let clientMessage = "Failed to connect to PhonePe gateway.";
    if (errorDetails?.message) {
      clientMessage = errorDetails.message;
    } else if (errorDetails?.code === "KEY_NOT_CONFIGURED") {
      clientMessage = "PhonePe Key Not Configured: Please verify your Merchant ID and Salt Key on PhonePe portal.";
    } else if (errorDetails?.code === "404" || err?.response?.status === 404) {
      clientMessage = "PhonePe Merchant account pending activation or invalid host URL. Check your PhonePe Dashboard.";
    } else if (err.message) {
      clientMessage = err.message;
    }

    res.status(400).send({
      message: clientMessage,
      error: errorDetails || err.message,
    });
  }
};

/**
 * Interactive PhonePe Gateway Test Simulator (for pre-activation testing)
 */
const phonePeMockCheckout = async (req, res) => {
  // Security Gate: Unconditionally disabled in production environment
  if (process.env.NODE_ENV === "production") {
    return res.status(404).send({ message: "Not Found" });
  }

  try {
    const { txId } = req.query;
    const pendingPayment = await PendingPayment.findOne({ merchantTransactionId: txId });
    if (!pendingPayment) {
      return res.status(404).send("Invalid or expired payment transaction.");
    }
    const amountFormatted = (pendingPayment.amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>PhonePe Payment Gateway (Test Simulator)</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f5f8; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 16px; }
            .card { background: white; padding: 36px 28px; border-radius: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.1); width: 100%; max-width: 420px; text-align: center; }
            .logo { background: #5f259f; color: white; width: 68px; height: 68px; border-radius: 20px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 28px; margin: 0 auto 16px; box-shadow: 0 8px 20px rgba(95,37,159,0.3); }
            .amount { font-size: 34px; font-weight: 900; color: #0b1d3d; margin: 12px 0 4px; }
            .desc { font-size: 12px; color: #6b7280; margin-bottom: 24px; word-break: break-all; }
            .btn-success { background: #5f259f; color: white; border: none; padding: 16px 24px; border-radius: 14px; font-weight: 800; font-size: 15px; cursor: pointer; width: 100%; margin-bottom: 12px; transition: all 0.2s; box-shadow: 0 4px 14px rgba(95,37,159,0.25); }
            .btn-success:hover { background: #4a1c7d; transform: translateY(-1px); }
            .btn-cancel { background: #f3f4f6; color: #4b5563; border: none; padding: 14px 24px; border-radius: 14px; font-weight: 700; font-size: 14px; cursor: pointer; width: 100%; transition: background 0.2s; }
            .btn-cancel:hover { background: #e5e7eb; }
            .badge { background: #f3e8ff; color: #5f259f; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; display: inline-block; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
            .info-box { background: #f9fafb; border: 1px border #e5e7eb; border-radius: 12px; padding: 12px; font-size: 12px; color: #4b5563; text-align: left; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">पे</div>
            <span class="badge">PhonePe Gateway Test Simulation</span>
            <h2 style="margin: 0; font-size: 20px; color: #0b1d3d;">Elecmoon Order Checkout</h2>
            <div class="amount">₹${amountFormatted}</div>
            <p class="desc">Txn ID: ${txId}</p>

            <div class="info-box">
              <strong>Simulated Gateway:</strong> Testing PhonePe checkout, automatic order creation, inventory deduction, and customer confirmation emails.
            </div>
            
            <button type="button" class="btn-success" onclick="window.location.href='/api/order/phonepe/callback?txId=${txId}&status=SUCCESS'">PAY ₹${amountFormatted} (Simulate Success)</button>
            <button type="button" class="btn-cancel" onclick="window.location.href='/api/order/phonepe/callback?txId=${txId}&status=FAILED'">Cancel Payment</button>
          </div>
        </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    res.status(500).send("Error rendering test simulator: " + err.message);
  }
};

/**
 * Verify Status with PhonePe PG Status API
 */
const phonePeStatusCheck = async (merchantTransactionId) => {
  const { merchantId, saltKey, saltIndex, hostUrl } = getPhonePeConfig();

  const endpoint = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
  const stringToSign = endpoint + saltKey;
  const checksum =
    crypto.createHash("sha256").update(stringToSign).digest("hex") +
    "###" +
    saltIndex;

  try {
    const response = await axios.get(`${hostUrl}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        "X-MERCHANT-ID": merchantId,
        "X-VERIFY": checksum,
      },
    });

    return response.data;
  } catch (err) {
    // If testing locally and evaluating a pending mock session
    if (process.env.NODE_ENV !== "production") {
      const pendingPayment = await PendingPayment.findOne({ merchantTransactionId });
      if (pendingPayment) {
        return {
          success: true,
          code: "PAYMENT_SUCCESS",
          data: {
            merchantId,
            merchantTransactionId,
            transactionId: "T_SIM_" + Date.now(),
            amount: Math.round(pendingPayment.amount * 100),
            state: "COMPLETED",
            responseCode: "SUCCESS"
          }
        };
      }
    }
    throw err;
  }
};

/**
 * PhonePe Browser Redirect Callback Handler
 */
const phonePeCallback = async (req, res) => {
  const reqProtocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const hostHeader = req.headers["x-forwarded-host"] || req.headers.host || "";

  let frontendBaseUrl = process.env.STORE_URL || "http://localhost:3000";
  if (!process.env.STORE_URL || hostHeader.includes("localhost") || hostHeader.includes("127.0.0.1")) {
    frontendBaseUrl = "http://localhost:3000";
  }

  try {
    const merchantTransactionId =
      req.query.txId || req.body?.merchantTransactionId || req.body?.transactionId;

    if (!merchantTransactionId) {
      return res.redirect(`${frontendBaseUrl}/checkout?error=invalid_callback`);
    }

    if (req.query.status === "FAILED") {
      return res.redirect(`${frontendBaseUrl}/checkout?error=payment_cancelled`);
    }

    const statusResult = await phonePeStatusCheck(merchantTransactionId);

    if (
      statusResult?.success &&
      (statusResult?.code === "PAYMENT_SUCCESS" ||
        statusResult?.data?.state === "COMPLETED")
    ) {
      const order = await processPhonePeSuccessPayment({
        merchantTransactionId,
        phonepeTransactionId: statusResult?.data?.transactionId || "",
        responseCode: statusResult?.code || "PAYMENT_SUCCESS",
      });

      return res.redirect(`${frontendBaseUrl}/user/thank-you?orderId=${order._id}`);
    } else {
      console.log(`[PhonePe Callback Failed] Transaction ${merchantTransactionId}:`, statusResult);
      return res.redirect(
        `${frontendBaseUrl}/checkout?error=payment_failed&msg=${encodeURIComponent(
          statusResult?.message || "Payment cancelled or failed"
        )}`
      );
    }
  } catch (err) {
    console.error("PhonePe callback error:", err?.response?.data || err.message);
    return res.redirect(
      `${frontendBaseUrl}/checkout?error=payment_error&msg=${encodeURIComponent(
        err.message || "Payment processing error"
      )}`
    );
  }
};

/**
 * PhonePe Server-to-Server Webhook Endpoint
 */
const phonePeWebhook = async (req, res) => {
  try {
    const { saltKey, saltIndex } = getPhonePeConfig();
    const xVerifyHeader = req.headers["x-verify"];
    const responsePayload = req.body?.response;

    if (responsePayload && xVerifyHeader) {
      const calculatedChecksum =
        crypto.createHash("sha256").update(responsePayload + saltKey).digest("hex") +
        "###" +
        saltIndex;

      if (calculatedChecksum !== xVerifyHeader) {
        console.warn("[PhonePe Webhook Warning] X-VERIFY signature mismatch!");
      }

      const decodedJson = JSON.parse(
        Buffer.from(responsePayload, "base64").toString("utf-8")
      );

      const merchantTransactionId = decodedJson?.data?.merchantTransactionId;
      const state = decodedJson?.data?.state;
      const code = decodedJson?.code;

      if (merchantTransactionId && (state === "COMPLETED" || code === "PAYMENT_SUCCESS")) {
        // Confirm with status check API
        const statusResult = await phonePeStatusCheck(merchantTransactionId);
        if (
          statusResult?.success &&
          (statusResult?.code === "PAYMENT_SUCCESS" ||
            statusResult?.data?.state === "COMPLETED")
        ) {
          await processPhonePeSuccessPayment({
            merchantTransactionId,
            phonepeTransactionId: statusResult?.data?.transactionId || decodedJson?.data?.transactionId || "",
            responseCode: code || "PAYMENT_SUCCESS",
          });
        }
      }
    }

    return res.status(200).send({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (err) {
    console.error("PhonePe webhook error:", err.message);
    return res.status(200).send({
      success: false,
      message: err.message,
    });
  }
};

/**
 * Direct API to verify PhonePe payment status
 */
const verifyPhonePePayment = async (req, res) => {
  try {
    const { merchantTransactionId } = req.body;
    if (!merchantTransactionId) {
      return res.status(400).send({ message: "merchantTransactionId is required" });
    }

    const statusResult = await phonePeStatusCheck(merchantTransactionId);

    if (
      statusResult?.success &&
      (statusResult?.code === "PAYMENT_SUCCESS" ||
        statusResult?.data?.state === "COMPLETED")
    ) {
      const order = await processPhonePeSuccessPayment({
        merchantTransactionId,
        phonepeTransactionId: statusResult?.data?.transactionId || "",
        responseCode: statusResult?.code || "PAYMENT_SUCCESS",
      });

      return res.status(200).send({
        success: true,
        order,
      });
    } else {
      return res.status(400).send({
        success: false,
        message: statusResult?.message || "Payment not verified as successful",
      });
    }
  } catch (err) {
    res.status(500).send({
      message: err.message,
    });
  }
};

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
};
