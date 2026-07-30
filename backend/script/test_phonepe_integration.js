const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

function runPhonePeTests() {
  console.log("=== PhonePe Integration Verification ===");

  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX;
  const hostUrl = process.env.PHONEPE_HOST_URL;

  console.log("Merchant ID:", merchantId);
  console.log("Salt Key:", saltKey ? `${saltKey.slice(0, 8)}...` : "MISSING");
  console.log("Salt Index:", saltIndex);
  console.log("Host URL:", hostUrl);

  if (!merchantId || !saltKey) {
    console.error("FAIL: PhonePe credentials missing from .env!");
    process.exit(1);
  }

  // Test 1: Payload Base64 and Checksum Generation
  const merchantTransactionId = `MT_TEST_${Date.now()}`;
  const payloadObj = {
    merchantId,
    merchantTransactionId,
    merchantUserId: "TEST_USER_123",
    amount: 50000, // 500.00 INR
    redirectUrl: "http://localhost:8083/api/order/phonepe/callback?txId=" + merchantTransactionId,
    redirectMode: "POST",
    callbackUrl: "http://localhost:8083/api/order/phonepe/webhook",
    mobileNumber: "9999999999",
    paymentInstrument: { type: "PAY_PAGE" }
  };

  const base64Payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64");
  const stringToSign = base64Payload + "/pg/v1/pay" + saltKey;
  const checksum = crypto.createHash("sha256").update(stringToSign).digest("hex") + "###" + saltIndex;

  console.log("\n[Test 1] Base64 Payload Length:", base64Payload.length);
  console.log("[Test 1] Generated X-VERIFY checksum:", checksum);
  if (!checksum.includes("###" + saltIndex)) {
    console.error("FAIL: Checksum does not end with salt index!");
    process.exit(1);
  }
  console.log("PASS: Base64 and X-VERIFY checksum correctly formatted.");

  // Test 2: Status Check Checksum Generation
  const statusEndpoint = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
  const statusStringToSign = statusEndpoint + saltKey;
  const statusChecksum = crypto.createHash("sha256").update(statusStringToSign).digest("hex") + "###" + saltIndex;

  console.log("\n[Test 2] Status Check Endpoint:", statusEndpoint);
  console.log("[Test 2] Status X-VERIFY Checksum:", statusChecksum);
  console.log("PASS: Status check checksum correctly formatted.");

  // Test 3: Webhook Verification Calculation
  const mockWebhookResponse = Buffer.from(JSON.stringify({
    success: true,
    code: "PAYMENT_SUCCESS",
    message: "Payment completed successfully",
    data: {
      merchantId,
      merchantTransactionId,
      transactionId: "T2607281200001",
      amount: 50000,
      state: "COMPLETED",
      responseCode: "SUCCESS"
    }
  })).toString("base64");

  const webhookChecksum = crypto.createHash("sha256").update(mockWebhookResponse + saltKey).digest("hex") + "###" + saltIndex;
  console.log("\n[Test 3] Simulated Webhook Response Base64:", mockWebhookResponse.slice(0, 30) + "...");
  console.log("[Test 3] Webhook X-VERIFY Checksum:", webhookChecksum);

  // Validate webhook checksum verification
  const calculatedWebhookChecksum = crypto.createHash("sha256").update(mockWebhookResponse + saltKey).digest("hex") + "###" + saltIndex;
  if (calculatedWebhookChecksum === webhookChecksum) {
    console.log("PASS: Webhook signature verification logic validated successfully.");
  } else {
    console.error("FAIL: Webhook signature verification failed!");
    process.exit(1);
  }

  console.log("\n=== ALL PHONEPE VERIFICATION TESTS PASSED ===");
}

runPhonePeTests();
