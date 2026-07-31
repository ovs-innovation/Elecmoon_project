const crypto = require("crypto");
const PhonePeService = require("./PhonePeService");
const PaymentVerificationService = require("./PaymentVerificationService");
const PendingPayment = require("../../models/PendingPayment");

const recentWebhookHashes = new Map();
const REPLAY_TTL_MS = 10 * 60 * 1000;

/**
 * PaymentWebhookService — S2S PhonePe webhooks.
 * Signature → replay guard → Status API re-verify → fulfill.
 */
class PaymentWebhookService {
  pruneReplayCache() {
    const now = Date.now();
    for (const [key, ts] of recentWebhookHashes.entries()) {
      if (now - ts > REPLAY_TTL_MS) recentWebhookHashes.delete(key);
    }
  }

  extractMerchantOrderId(payload) {
    return (
      payload?.payload?.merchantOrderId ||
      payload?.payload?.merchantOrderID ||
      payload?.merchantOrderId ||
      payload?.data?.merchantOrderId ||
      null
    );
  }

  extractState(payload) {
    return String(
      payload?.payload?.state || payload?.state || ""
    ).toUpperCase();
  }

  async handleWebhook({ headers, body, rawBody }) {
    console.log("[Payment][Webhook] received");

    const authorization =
      headers.authorization || headers.Authorization || headers["authorization"];

    const authResult = PhonePeService.verifyWebhookAuthorization(authorization);
    if (!authResult.ok) {
      const err = new Error(authResult.reason || "Unauthorized webhook");
      err.status = 401;
      throw err;
    }

    this.pruneReplayCache();
    const bodyString =
      typeof rawBody === "string" ? rawBody : JSON.stringify(body || {});
    const replayKey = crypto
      .createHash("sha256")
      .update(`${authorization || ""}:${bodyString}`)
      .digest("hex");

    if (recentWebhookHashes.has(replayKey)) {
      console.log("[Payment][Webhook] replay blocked");
      return { success: true, duplicate: true, replay: true };
    }
    recentWebhookHashes.set(replayKey, Date.now());

    const payload = body || {};
    const type = payload?.type || payload?.event || "";
    const state = this.extractState(payload);
    let merchantOrderId = this.extractMerchantOrderId(payload);

    if (!merchantOrderId && payload?.payload?.orderId) {
      const byPhonePe = await PendingPayment.findOne({
        phonepeTransactionId: payload.payload.orderId,
      });
      if (byPhonePe) merchantOrderId = byPhonePe.merchantOrderId;
    }

    if (!merchantOrderId && payload?.payload?.metaInfo?.udf1) {
      const Order = require("../../models/Order");
      const order = await Order.findOne({
        orderId: payload.payload.metaInfo.udf1,
      });
      if (order?.phonepeMerchantOrderId) {
        merchantOrderId = order.phonepeMerchantOrderId;
      }
    }

    if (!merchantOrderId) {
      console.warn("[Payment][Webhook] merchantOrderId missing", { type, state });
      return { success: true, ignored: true, reason: "missing merchantOrderId" };
    }

    const payment = await PendingPayment.findOne({
      $or: [
        { merchantOrderId },
        { merchantTransactionId: merchantOrderId },
      ],
    });

    if (payment) {
      payment.callbackResponse = payload;
      if (!Array.isArray(payment.logs)) payment.logs = [];
      payment.logs.push({
        at: new Date(),
        event: "Webhook",
        meta: { type, state, authConfigured: authResult.configured },
      });
      await payment.save();
    }

    // Never trust webhook body alone — re-verify via Status API
    const result = await PaymentVerificationService.verifyAndFulfill(
      merchantOrderId,
      { source: "webhook", callbackResponse: payload }
    );

    console.log("[Payment][Webhook] processed", {
      merchantOrderId,
      success: result.success,
      duplicate: result.duplicate,
      pending: result.pending,
      failed: result.failed,
    });

    return { success: true, result };
  }
}

module.exports = new PaymentWebhookService();
