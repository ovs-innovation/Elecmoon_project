const PendingPayment = require("../../models/PendingPayment");
const PaymentVerificationService = require("./PaymentVerificationService");
const OrderService = require("../order/OrderService");
const CallbackSecurity = require("./CallbackSecurity");

/**
 * PaymentCallbackService — browser redirect after PhonePe checkout.
 * Query params are NEVER used as payment success truth.
 * Always verifies via PhonePe Status API, then redirects UI only.
 */
class PaymentCallbackService {
  getFrontendBase(req) {
    return CallbackSecurity.getFrontendBaseUrl(req);
  }

  resolveMerchantOrderId(req) {
    return (
      req.query.merchantOrderId ||
      req.query.txId ||
      req.body?.merchantOrderId ||
      req.body?.merchantTransactionId ||
      null
    );
  }

  async handle(req) {
    const frontendBaseUrl = this.getFrontendBase(req);
    const merchantOrderId = this.resolveMerchantOrderId(req);

    console.log("[Payment][Callback]", {
      merchantOrderId,
      query: req.query,
    });

    if (!merchantOrderId) {
      return {
        redirectUrl: `${frontendBaseUrl}/checkout?error=invalid_callback`,
      };
    }

    const cancelSignal = String(req.query.status || "").toUpperCase();
    if (cancelSignal === "FAILED" || cancelSignal === "CANCELLED") {
      const payment = await PendingPayment.findOne({
        $or: [
          { merchantOrderId },
          { merchantTransactionId: merchantOrderId },
        ],
      });
      if (payment) {
        payment.paymentState = "MOCK_FAILED";
        if (!Array.isArray(payment.logs)) payment.logs = [];
        payment.logs.push({
          at: new Date(),
          event: "Callback",
          meta: { cancel: true },
        });
        await payment.save();
      }

      await PaymentVerificationService.verifyAndFulfill(merchantOrderId, {
        source: "callback-cancel",
        callbackResponse: { query: req.query, body: req.body },
      }).catch(() => null);

      await OrderService.markPaymentFailed({
        merchantOrderId,
        failureReason: "Payment cancelled by user",
        response: { query: req.query },
      });

      return {
        redirectUrl: `${frontendBaseUrl}/checkout?error=payment_cancelled`,
      };
    }

    if (
      process.env.PHONEPE_MOCK_MODE === "true" &&
      process.env.NODE_ENV !== "production" &&
      cancelSignal === "SUCCESS"
    ) {
      const payment = await PendingPayment.findOne({
        $or: [
          { merchantOrderId },
          { merchantTransactionId: merchantOrderId },
        ],
      });
      if (payment) {
        payment.paymentState = "MOCK_SUCCESS";
        await payment.save();
      }
    }

    const source =
      process.env.PHONEPE_MOCK_MODE === "true" &&
      cancelSignal === "SUCCESS"
        ? "mock-success"
        : "callback";

    const result = await PaymentVerificationService.verifyAndFulfill(
      merchantOrderId,
      {
        source,
        callbackResponse: { query: req.query, body: req.body },
      }
    );

    // Frontend only shows UI — never decides success itself
    if (result.success && result.order) {
      return {
        redirectUrl: `${frontendBaseUrl}/user/thank-you?orderId=${result.order._id}`,
      };
    }

    if (result.pending) {
      return {
        redirectUrl: `${frontendBaseUrl}/checkout?error=payment_pending&msg=${encodeURIComponent(
          "Payment is still processing. Please wait and check My Orders."
        )}`,
      };
    }

    return {
      redirectUrl: `${frontendBaseUrl}/checkout?error=payment_failed&msg=${encodeURIComponent(
        result.normalized?.failureReason || "Payment cancelled or failed"
      )}`,
    };
  }
}

module.exports = new PaymentCallbackService();
