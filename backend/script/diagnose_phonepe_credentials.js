/**
 * PhonePe runtime credential diagnostic (secrets masked).
 * Run: node script/diagnose_phonepe_credentials.js
 */
require("dotenv").config();
const axios = require("axios");
const PhonePeService = require("../services/payment/PhonePeService");

function mask(value, show = 6) {
  if (!value) return "(empty)";
  const s = String(value);
  if (s.length <= show * 2) return "*".repeat(s.length);
  return `${s.slice(0, show)}…${s.slice(-4)} (len=${s.length})`;
}

function decodeJwtPayload(token) {
  try {
    const part = token.split(".")[1];
    const json = Buffer.from(part, "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function main() {
  console.log("\n=== PhonePe Runtime Env (masked) ===");
  const keys = [
    "PHONEPE_ENV",
    "PHONEPE_MERCHANT_ID",
    "PHONEPE_CLIENT_ID",
    "PHONEPE_CLIENT_SECRET",
    "PHONEPE_CLIENT_VERSION",
    "PHONEPE_AUTH_URL",
    "PHONEPE_PG_URL",
    "PHONEPE_MOCK_MODE",
    "PHONEPE_SALT_KEY",
    "PHONEPE_SALT_INDEX",
    "PUBLIC_API_URL",
    "STORE_URL",
  ];
  for (const k of keys) {
    const v = process.env[k];
    if (k.includes("SECRET") || k.includes("SALT_KEY") || k.includes("PASSWORD")) {
      console.log(`${k}=${mask(v)}`);
    } else {
      console.log(`${k}=${v === undefined ? "(unset)" : v}`);
    }
  }

  console.log("\n=== Salt key usage ===");
  console.log(
    "PHONEPE_SALT_KEY present:",
    Boolean(process.env.PHONEPE_SALT_KEY)
  );
  console.log(
    "PHONEPE_SALT_INDEX present:",
    Boolean(process.env.PHONEPE_SALT_INDEX)
  );
  console.log(
    "Note: PhonePe PG V2 does NOT use salt key/index (OAuth only)."
  );

  const cfg = PhonePeService.getConfig();
  console.log("\n=== PhonePeService.getConfig() ===");
  console.log({
    env: cfg.env,
    merchantId: cfg.merchantId || "(empty)",
    clientId: cfg.clientId,
    clientVersion: cfg.clientVersion,
    clientSecret: mask(cfg.clientSecret),
    authBaseUrl: cfg.authBaseUrl,
    pgBaseUrl: cfg.pgBaseUrl,
  });

  console.log("\n=== OAuth token ===");
  const token = await PhonePeService.getAccessToken();
  const claims = decodeJwtPayload(token);
  console.log("token_prefix:", mask(token, 12));
  console.log("jwt_claims:", JSON.stringify(claims, null, 2));

  const tokenMerchantId =
    claims?.merchantId || claims?.merchant_id || claims?.mid || null;
  console.log("\n=== Merchant ID comparison ===");
  console.log("env PHONEPE_MERCHANT_ID:", process.env.PHONEPE_MERCHANT_ID);
  console.log("jwt merchantId:", tokenMerchantId);
  console.log(
    "MATCH env vs jwt:",
    String(process.env.PHONEPE_MERCHANT_ID) === String(tokenMerchantId)
  );

  // Create a tiny pay then status to see merchantId in status response
  const merchantOrderId = `EM-DIAG-${Date.now()}`;
  const redirectUrl = `${
    process.env.PUBLIC_API_URL || "https://api.elecmoon.com"
  }/api/order/phonepe/callback?merchantOrderId=${merchantOrderId}`;

  console.log("\n=== Create payment (₹1) ===");
  const pay = await PhonePeService.createPayment({
    merchantOrderId,
    amountPaise: 100,
    redirectUrl,
  });
  console.log("pay.orderId:", pay.orderId);
  console.log("pay.state:", pay.state);

  console.log("\n=== Order status response keys ===");
  const status = await PhonePeService.getOrderStatus(merchantOrderId);
  console.log("status.merchantId:", status.merchantId ?? "(absent)");
  console.log("status.state:", status.state);
  console.log("status.orderId:", status.orderId);
  console.log(
    "status top-level keys:",
    Object.keys(status || {}).join(", ")
  );

  if (status.merchantId) {
    console.log(
      "MATCH env vs status.merchantId:",
      String(process.env.PHONEPE_MERCHANT_ID) === String(status.merchantId)
    );
    console.log(
      "MATCH jwt vs status.merchantId:",
      String(tokenMerchantId) === String(status.merchantId)
    );
  }

  console.log("\n=== Root-cause hint ===");
  if (
    process.env.PHONEPE_MERCHANT_ID &&
    tokenMerchantId &&
    String(process.env.PHONEPE_MERCHANT_ID) !== String(tokenMerchantId)
  ) {
    console.log(
      "MISMATCH: PHONEPE_MERCHANT_ID (Business MID) != OAuth JWT merchantId."
    );
    console.log(
      "V2 auth identity is Client ID; Business MID M228… is NOT what PhonePe returns in JWT/status."
    );
    console.log(
      "Our OrderService compares status.merchantId to PHONEPE_MERCHANT_ID → false 'Merchant ID mismatch'."
    );
  }
}

main().catch((err) => {
  console.error("FAILED:", err?.response?.data || err.message);
  process.exit(1);
});
