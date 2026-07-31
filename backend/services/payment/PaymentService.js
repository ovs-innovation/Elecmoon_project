const crypto = require("crypto");
const PendingPayment = require("../../models/PendingPayment");
const PhonePeService = require("./PhonePeService");
const OrderService = require("../order/OrderService");
const CallbackSecurity = require("./CallbackSecurity");
const PendingOrderExpiryService = require("./PendingOrderExpiryService");
const {
  calculateOrderTotals,
} = require("../../lib/order/calculateOrderTotals");

class PaymentService {
  generateMerchantOrderId() {
    // PhonePe V2: max 63 chars, only _ and -
    return `EM-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  }

  appendLog(doc, event, meta = {}) {
    const entry = {
      at: new Date(),
      event,
      meta,
    };
    if (!Array.isArray(doc.logs)) doc.logs = [];
    doc.logs.push(entry);
    console.log(`[Payment][${event}]`, JSON.stringify(meta));
  }

  /**
   * Create pending order + PhonePe checkout session.
   */
  async createPhonePeCheckout({ req, body }) {
    // Opportunistic cleanup of expired pending sessions
    PendingOrderExpiryService.run().catch(() => null);

    const originCheck = CallbackSecurity.validateRequestOrigins(req);
    if (!originCheck.ok) {
      const err = new Error(originCheck.reason);
      err.status = 403;
      throw err;
    }

    const { cart, user_info, shippingOption, couponCode, discount } =
      body || {};

    const totals = await calculateOrderTotals({
      cart,
      couponCode,
      shippingOption,
      discount,
    });

    const merchantOrderId = this.generateMerchantOrderId();
    const amountPaise = Math.round(totals.total * 100);

    if (amountPaise < 100) {
      const err = new Error("Minimum payment amount is ₹1.00");
      err.status = 400;
      throw err;
    }

    const orderPayload = {
      user_info,
      cart: totals.cart,
      subTotal: totals.subTotal,
      shippingCost: totals.shippingCost,
      discount: totals.discount,
      total: totals.total,
      shippingOption: totals.shippingOption,
      orderId: OrderService.generateOrderId(),
    };

    // 1) Pending Order (no inventory yet)
    const order = await OrderService.createPendingOrder({
      userId: req.user?._id || null,
      orderPayload,
      merchantOrderId,
      amount: totals.total,
    });

    // 2) Payment session record
    const payment = await PendingPayment.create({
      merchantTransactionId: merchantOrderId,
      merchantOrderId,
      orderRef: order._id,
      user: req.user?._id || null,
      orderPayload,
      amount: totals.total,
      amountPaise,
      currency: "INR",
      status: "PENDING",
      paymentState: "PENDING",
      logs: [
        {
          at: new Date(),
          event: "Payment Created",
          meta: { merchantOrderId, orderId: order.orderId },
        },
      ],
    });

    const backendBase = CallbackSecurity.getBackendBaseUrl(req);
    const redirectUrl = `${backendBase}/api/order/phonepe/callback?merchantOrderId=${encodeURIComponent(
      merchantOrderId
    )}`;

    // Mock mode for local/dev without live PhonePe
    if (process.env.PHONEPE_MOCK_MODE === "true") {
      if (process.env.NODE_ENV === "production") {
        const err = new Error("PHONEPE_MOCK_MODE is not allowed in production");
        err.status = 500;
        throw err;
      }
      const mockUrl = `${backendBase}/api/order/phonepe/mock-checkout?merchantOrderId=${encodeURIComponent(
        merchantOrderId
      )}`;
      this.appendLog(payment, "Redirected (Mock)", { mockUrl });
      await payment.save();
      return {
        success: true,
        redirectUrl: mockUrl,
        merchantOrderId,
        orderId: order.orderId,
        orderMongoId: order._id,
      };
    }

    // 3) Create PhonePe V2 payment
    let phonepeRes;
    try {
      phonepeRes = await PhonePeService.createPayment({
        merchantOrderId,
        amountPaise,
        redirectUrl,
        metaInfo: {
          udf1: String(order.orderId || ""),
          udf2: String(order._id || ""),
          udf3: String(user_info?.email || "").slice(0, 50),
        },
      });
    } catch (err) {
      payment.status = "FAILED";
      payment.paymentState = "FAILED";
      payment.failureReason =
        err?.response?.data?.message || err.message || "PhonePe create failed";
      payment.response = err?.response?.data || {};
      this.appendLog(payment, "Payment Create Failed", {
        error: payment.failureReason,
      });
      await payment.save();

      await OrderService.markPaymentFailed({
        merchantOrderId,
        failureReason: payment.failureReason,
        response: payment.response,
      });

      const e = new Error(payment.failureReason);
      e.status = 400;
      e.details = err?.response?.data;
      throw e;
    }

    payment.phonepeTransactionId = phonepeRes?.orderId || "";
    payment.response = phonepeRes || {};
    payment.paymentState = phonepeRes?.state || "PENDING";
    this.appendLog(payment, "Redirected", {
      redirectUrl: phonepeRes?.redirectUrl,
      phonepeOrderId: phonepeRes?.orderId,
    });
    await payment.save();

    if (!phonepeRes?.redirectUrl) {
      const err = new Error("PhonePe did not return a redirect URL");
      err.status = 400;
      throw err;
    }

    return {
      success: true,
      redirectUrl: phonepeRes.redirectUrl,
      merchantOrderId,
      orderId: order.orderId,
      orderMongoId: order._id,
      phonepeOrderId: phonepeRes.orderId,
      expireAt: phonepeRes.expireAt,
    };
  }
}

module.exports = new PaymentService();
