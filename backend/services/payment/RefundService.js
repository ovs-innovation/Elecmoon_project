const crypto = require("crypto");
const PhonePeService = require("./PhonePeService");
const Order = require("../../models/Order");
const { PaymentStatus } = require("./PaymentStatus");

/**
 * Refund-ready service (architecture). Controllers stay thin.
 */
class RefundService {
  generateRefundId() {
    return `RF-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  }

  async initiateForOrder({ orderId, amountPaise, reason }) {
    const order = await Order.findOne({
      $or: [{ orderId }, { _id: orderId }],
    });

    if (!order) throw new Error("Order not found");
    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new Error("Only PAID orders can be refunded");
    }
    if (order.currency && order.currency !== "INR") {
      throw new Error("Only INR refunds supported");
    }

    const merchantRefundId = this.generateRefundId();
    const refundAmount =
      amountPaise != null
        ? Number(amountPaise)
        : Math.round(Number(order.total) * 100);

    const response = await PhonePeService.initiateRefund({
      merchantRefundId,
      originalMerchantOrderId: order.phonepeMerchantOrderId,
      amountPaise: refundAmount,
    });

    order.paymentStatus = PaymentStatus.REFUNDED;
    order.failureReason = reason || "Refund initiated";
    order.paymentResponse = {
      ...(order.paymentResponse || {}),
      refund: response,
      merchantRefundId,
    };
    await order.save();

    console.log("[Payment][Refund]", {
      orderId: order.orderId,
      merchantRefundId,
      refundAmount,
    });

    return { order, merchantRefundId, response };
  }

  async getStatus(merchantRefundId) {
    return PhonePeService.getRefundStatus(merchantRefundId);
  }
}

module.exports = new RefundService();
