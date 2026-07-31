/**
 * Recover orders that PhonePe shows COMPLETED but our DB is not PAID
 * (e.g. prior merchant O/0 typo or mongoose crash after payment).
 *
 * Run: node script/recover_completed_phonepe_payments.js
 */
require("dotenv").config();
const { connectDB } = require("../config/db");
const Order = require("../models/Order");
const PendingPayment = require("../models/PendingPayment");
const PhonePeService = require("../services/payment/PhonePeService");
const PaymentVerificationService = require("../services/payment/PaymentVerificationService");
const { PaymentStatus } = require("../services/payment/PaymentStatus");

async function main() {
  await connectDB();
  PhonePeService.logRuntimeConfig();

  const stuck = await Order.find({
    paymentMethod: "PhonePe",
    paymentStatus: {
      $in: [
        PaymentStatus.PENDING,
        PaymentStatus.FAILED,
        PaymentStatus.CANCELLED,
        PaymentStatus.PROCESSING,
        "pending",
        "failed",
      ],
    },
    phonepeMerchantOrderId: { $exists: true, $ne: "" },
  })
    .sort({ createdAt: -1 })
    .limit(50);

  console.log(`Found ${stuck.length} non-PAID PhonePe orders to inspect`);

  const results = [];
  for (const order of stuck) {
    const mid = order.phonepeMerchantOrderId;
    try {
      const status = await PhonePeService.getOrderStatus(mid);
      const state = String(status?.state || "").toUpperCase();
      console.log(`- ${mid} db=${order.paymentStatus} phonepe=${state}`);

      if (state !== "COMPLETED") {
        results.push({ mid, action: "skip", state });
        continue;
      }

      const outcome = await PaymentVerificationService.verifyAndFulfill(mid, {
        source: "api-verify",
      });
      results.push({
        mid,
        action: outcome.success ? "recovered" : "verify_failed",
        orderId: outcome.order?.orderId,
        duplicate: outcome.duplicate || false,
      });
    } catch (err) {
      results.push({ mid, action: "error", error: err.message });
    }
  }

  console.log("\n=== Recovery results ===");
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
