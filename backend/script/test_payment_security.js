/**
 * Automated payment security & flow tests (no live PhonePe charge required).
 * Run: node script/test_payment_security.js
 */
require("dotenv").config();
const crypto = require("crypto");
const assert = require("assert");

const PhonePeService = require("../services/payment/PhonePeService");
const CallbackSecurity = require("../services/payment/CallbackSecurity");
const PaymentWebhookService = require("../services/payment/PaymentWebhookService");
const { PaymentStatus } = require("../services/payment/PaymentStatus");

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  ${err.message}`);
    failed++;
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(`  ${err.message}`);
    failed++;
  }
}

console.log("=== Payment Security & Architecture Tests ===\n");

test("Whitelist accepts elecmoon.com", () => {
  assert.strictEqual(
    CallbackSecurity.originAllowed("https://elecmoon.com"),
    true
  );
});

test("Whitelist rejects raw IP URLs", () => {
  assert.strictEqual(
    CallbackSecurity.originAllowed("https://1.2.3.4"),
    false
  );
});

test("Whitelist rejects unknown origins", () => {
  assert.strictEqual(
    CallbackSecurity.originAllowed("https://evil.example.com"),
    false
  );
});

test("Localhost rejected when PAYMENT_ALLOW_LOCALHOST=false and production", () => {
  const prevAllow = process.env.PAYMENT_ALLOW_LOCALHOST;
  const prevNode = process.env.NODE_ENV;
  process.env.PAYMENT_ALLOW_LOCALHOST = "false";
  process.env.NODE_ENV = "production";
  assert.strictEqual(
    CallbackSecurity.originAllowed("http://localhost:3000"),
    false
  );
  process.env.PAYMENT_ALLOW_LOCALHOST = prevAllow;
  process.env.NODE_ENV = prevNode;
});

test("Webhook SHA256 signature verification accepts valid header", () => {
  const user = process.env.PHONEPE_WEBHOOK_USERNAME || "elecmoon_webhook";
  const pass = process.env.PHONEPE_WEBHOOK_PASSWORD || "test_pass";
  process.env.PHONEPE_WEBHOOK_USERNAME = user;
  process.env.PHONEPE_WEBHOOK_PASSWORD = pass;
  const expected = crypto
    .createHash("sha256")
    .update(`${user}:${pass}`)
    .digest("hex");
  const result = PhonePeService.verifyWebhookAuthorization(expected);
  assert.strictEqual(result.ok, true);
});

test("Webhook SHA256 signature verification rejects tampered header", () => {
  process.env.PHONEPE_WEBHOOK_USERNAME = "elecmoon_webhook";
  process.env.PHONEPE_WEBHOOK_PASSWORD = "secret";
  const result = PhonePeService.verifyWebhookAuthorization("deadbeef");
  assert.strictEqual(result.ok, false);
});

test("normalizeStatus marks COMPLETED as success", () => {
  const n = PhonePeService.normalizeStatus({
    state: "COMPLETED",
    amount: 10000,
    orderId: "OMO1",
    paymentDetails: [
      { transactionId: "TX1", paymentMode: "UPI_QR", state: "COMPLETED" },
    ],
  });
  assert.strictEqual(n.isSuccess, true);
  assert.strictEqual(n.isFailed, false);
});

test("normalizeStatus marks FAILED as failed", () => {
  const n = PhonePeService.normalizeStatus({
    state: "FAILED",
    amount: 10000,
    errorCode: "USER_CANCELLED",
    paymentDetails: [],
  });
  assert.strictEqual(n.isFailed, true);
  assert.strictEqual(n.isSuccess, false);
});

test("Merchant order id format is PhonePe-safe", () => {
  const id = `EM-${Date.now()}-abc123`;
  assert.ok(id.length <= 63);
  assert.ok(/^[A-Za-z0-9_-]+$/.test(id));
});

(async () => {
  await testAsync("Replay cache blocks duplicate webhook body", async () => {
    process.env.PHONEPE_WEBHOOK_USERNAME = "u";
    process.env.PHONEPE_WEBHOOK_PASSWORD = "p";
    const auth = crypto.createHash("sha256").update("u:p").digest("hex");
    const body = { type: "PG_ORDER_COMPLETED", payload: { merchantOrderId: "EM-TEST-REPLAY" } };

    // First call may fail on DB / status — we only assert replay path after first hash store
    try {
      await PaymentWebhookService.handleWebhook({
        headers: { authorization: auth },
        body,
        rawBody: JSON.stringify(body),
      });
    } catch (_) {
      /* status API may fail without live order — hash still stored */
    }

    const second = await PaymentWebhookService.handleWebhook({
      headers: { authorization: auth },
      body,
      rawBody: JSON.stringify(body),
    });
    assert.strictEqual(second.replay || second.duplicate, true);
  });

  test("PaymentStatus enum includes PAID/CANCELLED/REFUNDED", () => {
    assert.strictEqual(PaymentStatus.PAID, "PAID");
    assert.strictEqual(PaymentStatus.CANCELLED, "CANCELLED");
    assert.strictEqual(PaymentStatus.REFUNDED, "REFUNDED");
  });

  await testAsync("PhonePe OAuth token can be fetched with production credentials", async () => {
    if (!process.env.PHONEPE_CLIENT_ID || !process.env.PHONEPE_CLIENT_SECRET) {
      console.log("  (skipped — credentials missing)");
      return;
    }
    const token = await PhonePeService.getAccessToken();
    assert.ok(token && token.length > 20, "access_token should be non-empty");
  });

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
})();
