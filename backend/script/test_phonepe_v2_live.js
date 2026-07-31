/**
 * Live PhonePe V2 smoke test: OAuth + create payment (₹1).
 * Run: node script/test_phonepe_v2_live.js
 */
require("dotenv").config();
const PhonePeService = require("../services/payment/PhonePeService");

async function main() {
  console.log("PhonePe ENV:", process.env.PHONEPE_ENV);
  console.log("Merchant:", process.env.PHONEPE_MERCHANT_ID);
  console.log("Client ID:", process.env.PHONEPE_CLIENT_ID);
  console.log("PUBLIC_API_URL:", process.env.PUBLIC_API_URL);
  console.log("STORE_URL:", process.env.STORE_URL);

  const token = await PhonePeService.getAccessToken();
  console.log("✓ OAuth token received:", token.slice(0, 24) + "…");

  const merchantOrderId = `EM-SMOKE-${Date.now()}`;
  const redirectUrl =
    (process.env.PUBLIC_API_URL || "https://api.elecmoon.com") +
    `/api/order/phonepe/callback?merchantOrderId=${merchantOrderId}`;

  const pay = await PhonePeService.createPayment({
    merchantOrderId,
    amountPaise: 100,
    redirectUrl,
    metaInfo: { udf1: "smoke-test" },
  });

  console.log("✓ Create payment response:");
  console.log(JSON.stringify(pay, null, 2));
  console.log("\nOpen this URL to pay ₹1:");
  console.log(pay.redirectUrl);
}

main().catch((err) => {
  console.error("FAILED:", err?.response?.data || err.message);
  process.exit(1);
});
