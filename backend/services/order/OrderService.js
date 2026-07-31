const crypto = require("crypto");
const Order = require("../../models/Order");
const {
  queueOrderInvoiceEmail,
} = require("../../lib/email-sender/sendOrderInvoiceEmail");
const {
  queueOrderNotificationEmail,
} = require("../../lib/email-sender/adminNotificationEmail");
const InventoryService = require("../inventory/InventoryService");
const { PaymentStatus } = require("../payment/PaymentStatus");

const generateOrderId = () =>
  "ORD-" + crypto.randomBytes(4).toString("hex").toUpperCase();

class OrderService {
  generateOrderId() {
    return generateOrderId();
  }

  /**
   * Create Pending order BEFORE PhonePe redirect.
   * Inventory is NOT reduced here (online payments).
   */
  async createPendingOrder({
    userId,
    orderPayload,
    merchantOrderId,
    amount,
  }) {
    const order = await Order.create({
      ...orderPayload,
      user: userId || null,
      orderId: orderPayload.orderId || generateOrderId(),
      paymentMethod: "PhonePe",
      status: "Pending",
      paymentStatus: PaymentStatus.PENDING,
      phonepeMerchantTransactionId: merchantOrderId,
      phonepeMerchantOrderId: merchantOrderId,
      phonepeMerchantId: process.env.PHONEPE_MERCHANT_ID || "",
      currency: "INR",
      amount,
      expiresAt: new Date(
        Date.now() +
          (Number(process.env.PAYMENT_PENDING_TTL_MINUTES) || 15) * 60 * 1000
      ),
    });

    this.log("Created", {
      orderId: order.orderId,
      merchantOrderId,
      amount,
      expiresAt: order.expiresAt,
    });

    return order;
  }

  async createCashOrder({ userId, orderPayload }) {
    const order = await Order.create({
      ...orderPayload,
      user: userId || null,
      orderId: orderPayload.orderId || generateOrderId(),
      paymentMethod: "Cash",
      status: "Pending",
      paymentStatus: PaymentStatus.PENDING,
      currency: "INR",
      amount: orderPayload.total,
    });

    await InventoryService.reduceForOrder(order.cart);
    queueOrderInvoiceEmail(order);
    queueOrderNotificationEmail(order);

    this.log("COD Created", { orderId: order.orderId });
    return order;
  }

  /**
   * Confirm paid order after PhonePe Status API verification.
   * Atomic claim prevents duplicate invoice / inventory on callback storms.
   */
  async confirmPaidOrder({
    merchantOrderId,
    phonepeTransactionId,
    phonepeOrderId,
    paymentMethod,
    paymentResponse,
    verifiedAmountPaise,
    verifiedCurrency,
    verifiedMerchantId,
  }) {
    const alreadyPaid = await Order.findOne({
      phonepeMerchantOrderId: merchantOrderId,
      paymentStatus: PaymentStatus.PAID,
    });
    if (alreadyPaid) {
      this.log("Already Paid — ignore duplicate", { merchantOrderId });
      return alreadyPaid;
    }

    const claimed = await Order.findOneAndUpdate(
      {
        phonepeMerchantOrderId: merchantOrderId,
        paymentStatus: {
          $in: [
            PaymentStatus.PENDING,
            // Allow recovery when a prior bug marked FAILED but PhonePe is COMPLETED
            PaymentStatus.FAILED,
            PaymentStatus.CANCELLED,
          ],
        },
      },
      { $set: { paymentStatus: PaymentStatus.PROCESSING } },
      { new: true }
    );

    if (!claimed) {
      const existing = await Order.findOne({
        phonepeMerchantOrderId: merchantOrderId,
      });
      if (existing?.paymentStatus === PaymentStatus.PAID) {
        this.log("Already Paid — ignore duplicate", { merchantOrderId });
        return existing;
      }
      if (
        existing?.paymentStatus === PaymentStatus.CANCELLED ||
        existing?.paymentStatus === PaymentStatus.FAILED
      ) {
        throw new Error(
          `Order is ${existing.paymentStatus} and cannot be marked paid`
        );
      }
      throw new Error(
        `Order not found or not claimable for merchantOrderId=${merchantOrderId}`
      );
    }

    // Currency: INR only
    const currency = String(verifiedCurrency || "INR").toUpperCase();
    if (currency && currency !== "INR") {
      await Order.findByIdAndUpdate(claimed._id, {
        paymentStatus: PaymentStatus.FAILED,
        status: "Cancelled",
        failureReason: `Currency rejected: ${currency}`,
      });
      throw new Error("Only INR payments are accepted");
    }

    // Merchant validation (advisory + O/0 tolerant).
    // V2 identity is already proven by OAuth Status API for this merchantOrderId.
    // Dashboard fonts often make digit 0 and letter O look identical — fold them for compare.
    const configuredMerchant = String(
      process.env.PHONEPE_MERCHANT_ID || ""
    ).trim();
    const remoteMerchant = String(verifiedMerchantId || "").trim();
    const foldMid = (id) =>
      String(id || "")
        .trim()
        .toUpperCase()
        .replace(/O/g, "0");
    if (
      remoteMerchant &&
      configuredMerchant &&
      remoteMerchant !== configuredMerchant &&
      foldMid(remoteMerchant) !== foldMid(configuredMerchant)
    ) {
      const detail = `Merchant mismatch: PhonePe returned "${remoteMerchant}", env PHONEPE_MERCHANT_ID is "${configuredMerchant}"`;
      console.error("[Payment][Merchant]", detail);
      await Order.findByIdAndUpdate(claimed._id, {
        paymentStatus: PaymentStatus.FAILED,
        status: "Cancelled",
        failureReason: detail,
      });
      throw new Error("Merchant ID mismatch — payment rejected");
    }
    if (
      remoteMerchant &&
      configuredMerchant &&
      remoteMerchant !== configuredMerchant &&
      foldMid(remoteMerchant) === foldMid(configuredMerchant)
    ) {
      console.warn(
        "[Payment][Merchant] O/0 glyph mismatch tolerated:",
        { remoteMerchant, configuredMerchant }
      );
    }

    if (
      claimed.phonepeMerchantOrderId &&
      claimed.phonepeMerchantOrderId !== merchantOrderId
    ) {
      await Order.findByIdAndUpdate(claimed._id, {
        paymentStatus: PaymentStatus.FAILED,
        status: "Cancelled",
        failureReason: "merchantOrderId mismatch",
      });
      throw new Error("merchantOrderId mismatch — payment rejected");
    }

    // Amount: DB paise == PhonePe paise
    const expectedPaise = Math.round(Number(claimed.total) * 100);
    if (
      verifiedAmountPaise == null ||
      Number(verifiedAmountPaise) !== expectedPaise
    ) {
      await Order.findByIdAndUpdate(claimed._id, {
        paymentStatus: PaymentStatus.FAILED,
        status: "Cancelled",
        failureReason: `Amount mismatch: expected ${expectedPaise}, got ${verifiedAmountPaise}`,
      });
      throw new Error("Payment amount mismatch — order cancelled");
    }

    claimed.status = "Processing";
    claimed.paymentStatus = PaymentStatus.PAID;
    claimed.phonepeTransactionId = phonepeTransactionId || "";
    claimed.phonepeOrderId = phonepeOrderId || "";
    claimed.phonepeResponseCode = "COMPLETED";
    claimed.paymentMethodDetail = paymentMethod || "";
    claimed.verifiedAt = new Date();
    claimed.paymentResponse = paymentResponse || {};
    claimed.failureReason = "";
    claimed.currency = "INR";
    await claimed.save();

    this.log("Completed", {
      orderId: claimed.orderId,
      merchantOrderId,
      phonepeTransactionId,
    });

    await InventoryService.reduceForOrder(claimed.cart);
    this.log("Inventory Updated", { orderId: claimed.orderId });

    queueOrderInvoiceEmail(claimed);
    this.log("Invoice Generated", { orderId: claimed.orderId });

    queueOrderNotificationEmail(claimed);
    this.log("Email Sent", { orderId: claimed.orderId });

    return claimed;
  }

  async markPaymentFailed({ merchantOrderId, failureReason, response }) {
    const order = await Order.findOneAndUpdate(
      {
        phonepeMerchantOrderId: merchantOrderId,
        paymentStatus: {
          $in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING],
        },
      },
      {
        $set: {
          paymentStatus: PaymentStatus.FAILED,
          status: "Cancelled",
          failureReason: failureReason || "Payment failed",
          paymentResponse: response || {},
          verifiedAt: new Date(),
        },
      },
      { new: true }
    );

    if (order) {
      this.log("Failed", {
        orderId: order.orderId,
        merchantOrderId,
        failureReason,
      });
    }

    return order;
  }

  /**
   * Expire unpaid pending PhonePe orders.
   * Stock was never reduced for PENDING online orders — no release needed.
   */
  async cancelExpiredPendingOrders({ ttlMinutes } = {}) {
    const minutes =
      ttlMinutes || Number(process.env.PAYMENT_PENDING_TTL_MINUTES) || 15;
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);

    const filter = {
      paymentMethod: "PhonePe",
      paymentStatus: PaymentStatus.PENDING,
      $or: [
        { expiresAt: { $lte: new Date() } },
        { expiresAt: { $exists: false }, createdAt: { $lte: cutoff } },
      ],
    };

    const expired = await Order.find(filter).limit(200);
    let cancelled = 0;

    for (const order of expired) {
      const updated = await Order.findOneAndUpdate(
        {
          _id: order._id,
          paymentStatus: PaymentStatus.PENDING,
        },
        {
          $set: {
            paymentStatus: PaymentStatus.CANCELLED,
            status: "Cancelled",
            failureReason: `Payment session expired after ${minutes} minutes`,
            verifiedAt: new Date(),
          },
        },
        { new: true }
      );

      if (updated) {
        cancelled += 1;
        const PendingPayment = require("../../models/PendingPayment");
        await PendingPayment.updateOne(
          {
            $or: [
              { merchantOrderId: updated.phonepeMerchantOrderId },
              { merchantTransactionId: updated.phonepeMerchantOrderId },
            ],
            status: "PENDING",
          },
          {
            $set: {
              status: "FAILED",
              paymentState: "EXPIRED",
              failureReason: `Expired after ${minutes} minutes`,
              verifiedAt: new Date(),
            },
            $push: {
              logs: {
                at: new Date(),
                event: "Expired",
                meta: { minutes },
              },
            },
          }
        );
        this.log("Cancelled (expired)", {
          orderId: updated.orderId,
          merchantOrderId: updated.phonepeMerchantOrderId,
        });
      }
    }

    return { scanned: expired.length, cancelled, ttlMinutes: minutes };
  }

  log(event, meta = {}) {
    console.log(`[Payment][${event}]`, JSON.stringify(meta));
  }
}

module.exports = new OrderService();
