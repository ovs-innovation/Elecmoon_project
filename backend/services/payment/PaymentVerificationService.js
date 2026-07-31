const PendingPayment = require("../../models/PendingPayment");
const PhonePeService = require("./PhonePeService");
const OrderService = require("../order/OrderService");
const { PaymentStatus } = require("./PaymentStatus");
const Order = require("../../models/Order");

/**
 * PaymentVerificationService
 * ALWAYS verifies against PhonePe Order Status API.
 * Frontend / redirect query params are never trusted for success.
 */
class PaymentVerificationService {
  appendLog(payment, event, meta = {}) {
    if (!payment) return;
    if (!Array.isArray(payment.logs)) payment.logs = [];
    payment.logs.push({ at: new Date(), event, meta });
    console.log(`[Payment][${event}]`, JSON.stringify(meta));
  }

  async verifyAndFulfill(
    merchantOrderId,
    { source = "verify", callbackResponse } = {}
  ) {
    if (!merchantOrderId) {
      throw new Error("merchantOrderId is required");
    }

    const payment = await PendingPayment.findOne({
      $or: [
        { merchantOrderId },
        { merchantTransactionId: merchantOrderId },
      ],
    });

    if (!payment) {
      throw new Error(`Payment session not found: ${merchantOrderId}`);
    }

    // Idempotency: already paid
    const paidOrder = await Order.findOne({
      phonepeMerchantOrderId: merchantOrderId,
      paymentStatus: PaymentStatus.PAID,
    });
    if (paidOrder || (payment.status === "SUCCESS" && payment.verifiedAt)) {
      this.appendLog(payment, "Already Paid", { source });
      await payment.save();
      return {
        success: true,
        duplicate: true,
        order: paidOrder,
        payment,
      };
    }

    // Expired / cancelled — do not resurrect without a live COMPLETED status
    const orderDoc = await Order.findOne({
      phonepeMerchantOrderId: merchantOrderId,
    });
    if (
      orderDoc &&
      (orderDoc.paymentStatus === PaymentStatus.CANCELLED ||
        orderDoc.paymentStatus === PaymentStatus.FAILED) &&
      source !== "webhook" &&
      source !== "callback" &&
      source !== "api-verify"
    ) {
      return {
        success: false,
        failed: true,
        payment,
        normalized: { state: orderDoc.paymentStatus, isFailed: true },
      };
    }

    let statusRaw;
    if (
      process.env.PHONEPE_MOCK_MODE === "true" &&
      process.env.NODE_ENV !== "production"
    ) {
      if (payment.paymentState === "MOCK_FAILED") {
        statusRaw = {
          state: "FAILED",
          amount: payment.amountPaise,
          currency: "INR",
          merchantId: process.env.PHONEPE_MERCHANT_ID,
          orderId: "MOCK_ORDER",
          paymentDetails: [],
          errorCode: "USER_CANCELLED",
        };
      } else if (
        payment.paymentState === "MOCK_SUCCESS" ||
        source === "mock-success"
      ) {
        statusRaw = {
          state: "COMPLETED",
          amount: payment.amountPaise,
          currency: "INR",
          merchantId: process.env.PHONEPE_MERCHANT_ID,
          orderId: "MOCK_ORDER",
          paymentDetails: [
            {
              transactionId: `MOCK_TXN_${Date.now()}`,
              paymentMode: "UPI_QR",
              state: "COMPLETED",
              amount: payment.amountPaise,
            },
          ],
        };
      } else {
        try {
          statusRaw = await PhonePeService.getOrderStatus(merchantOrderId);
        } catch {
          statusRaw = {
            state: "PENDING",
            amount: payment.amountPaise,
            currency: "INR",
            orderId: "",
            paymentDetails: [],
          };
        }
      }
    } else {
      statusRaw = await PhonePeService.getOrderStatus(merchantOrderId);
    }

    const normalized = PhonePeService.normalizeStatus(statusRaw);

    payment.response = statusRaw;
    if (callbackResponse) payment.callbackResponse = callbackResponse;
    payment.paymentState = normalized.state;
    payment.phonepeTransactionId =
      normalized.phonepeTransactionId || payment.phonepeTransactionId;
    payment.paymentMethod =
      normalized.paymentMethod || payment.paymentMethod;
    this.appendLog(payment, "Verified", {
      source,
      state: normalized.state,
      phonepeTransactionId: normalized.phonepeTransactionId,
      amountPaise: normalized.amountPaise,
    });

    if (normalized.isSuccess) {
      // Pre-validate amount before claim
      const expectedPaise = Math.round(Number(payment.amount) * 100);
      if (Number(normalized.amountPaise) !== expectedPaise) {
        await OrderService.markPaymentFailed({
          merchantOrderId,
          failureReason: `Amount mismatch: expected ${expectedPaise}, got ${normalized.amountPaise}`,
          response: statusRaw,
        });
        payment.status = "FAILED";
        payment.failureReason = "Amount mismatch";
        this.appendLog(payment, "Failed", { reason: "amount mismatch" });
        await payment.save();
        return { success: false, failed: true, payment, normalized };
      }

      if (normalized.currency && String(normalized.currency).toUpperCase() !== "INR") {
        await OrderService.markPaymentFailed({
          merchantOrderId,
          failureReason: `Currency rejected: ${normalized.currency}`,
          response: statusRaw,
        });
        payment.status = "FAILED";
        payment.failureReason = "Currency not INR";
        this.appendLog(payment, "Failed", { reason: "currency" });
        await payment.save();
        return { success: false, failed: true, payment, normalized };
      }

      const order = await OrderService.confirmPaidOrder({
        merchantOrderId,
        phonepeTransactionId: normalized.phonepeTransactionId,
        phonepeOrderId: normalized.phonepeOrderId,
        paymentMethod: normalized.paymentMethod,
        paymentResponse: statusRaw,
        verifiedAmountPaise: normalized.amountPaise,
        verifiedCurrency: normalized.currency || "INR",
        verifiedMerchantId: normalized.merchantId,
      });

      payment.status = "SUCCESS";
      payment.verifiedAt = new Date();
      payment.failureReason = "";
      this.appendLog(payment, "Completed", { orderId: order?.orderId });
      await payment.save();

      return { success: true, order, payment, normalized };
    }

    if (normalized.isFailed) {
      await OrderService.markPaymentFailed({
        merchantOrderId,
        failureReason: normalized.failureReason || "Payment failed",
        response: statusRaw,
      });

      payment.status = "FAILED";
      payment.failureReason = normalized.failureReason || "Payment failed";
      payment.verifiedAt = new Date();
      this.appendLog(payment, "Failed", { reason: payment.failureReason });
      await payment.save();

      return { success: false, failed: true, payment, normalized };
    }

    await payment.save();
    return { success: false, pending: true, payment, normalized };
  }
}

module.exports = new PaymentVerificationService();
