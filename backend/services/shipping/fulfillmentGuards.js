const { PaymentStatus } = require("../payment/PaymentStatus");

function isOrderBlockedForFulfillment(order) {
  if (!order) return true;
  const ps = String(order.paymentStatus || "").toUpperCase();
  if (ps === PaymentStatus.REFUNDED || ps === PaymentStatus.CANCELLED) {
    return true;
  }
  const st = String(order.status || "").trim();
  if (/^cancel/i.test(st)) return true;
  return false;
}

module.exports = { isOrderBlockedForFulfillment };
