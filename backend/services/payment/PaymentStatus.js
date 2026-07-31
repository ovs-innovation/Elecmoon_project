/**
 * Canonical payment statuses for Elecmoon orders.
 * Frontend must NEVER invent these — backend only.
 */
const PaymentStatus = Object.freeze({
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  PAID: "PAID",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
});

const CLAIMABLE = [PaymentStatus.PENDING];
const TERMINAL = [
  PaymentStatus.PAID,
  PaymentStatus.FAILED,
  PaymentStatus.CANCELLED,
  PaymentStatus.REFUNDED,
];

module.exports = {
  PaymentStatus,
  CLAIMABLE,
  TERMINAL,
};
