const OrderService = require("../order/OrderService");

/**
 * Expires unpaid PENDING PhonePe orders after TTL (default 15 min).
 * Online pending orders never reserved stock — cancel only.
 * Safe to call from Vercel Cron or local interval.
 */
class PendingOrderExpiryService {
  async run() {
    const result = await OrderService.cancelExpiredPendingOrders();
    console.log("[Payment][Expiry]", JSON.stringify(result));
    return result;
  }
}

module.exports = new PendingOrderExpiryService();
