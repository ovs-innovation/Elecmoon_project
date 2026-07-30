const axios = require("axios");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function testCombinations() {
  const configs = [
    {
      name: "Provided Credentials on Live Hermes",
      host: "https://api.phonepe.com/apis/hermes",
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      saltKey: process.env.PHONEPE_SALT_KEY,
      saltIndex: process.env.PHONEPE_SALT_INDEX
    },
    {
      name: "Provided Credentials on Preprod Sandbox",
      host: "https://api-preprod.phonepe.com/apis/pg-sandbox",
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      saltKey: process.env.PHONEPE_SALT_KEY,
      saltIndex: process.env.PHONEPE_SALT_INDEX
    },
    {
      name: "Standard UAT Test Merchant PGTESTPAYUAT on Preprod Sandbox",
      host: "https://api-preprod.phonepe.com/apis/pg-sandbox",
      merchantId: "PGTESTPAYUAT",
      saltKey: "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399",
      saltIndex: "1"
    }
  ];

  for (const cfg of configs) {
    console.log(`\n=== Testing: ${cfg.name} ===`);
    const merchantTransactionId = `MT_${Date.now()}`;
    const payloadObj = {
      merchantId: cfg.merchantId,
      merchantTransactionId,
      merchantUserId: "USER_123",
      amount: 167092,
      redirectUrl: "http://localhost:8083/api/order/phonepe/callback?txId=" + merchantTransactionId,
      redirectMode: "POST",
      callbackUrl: "http://localhost:8083/api/order/phonepe/webhook",
      mobileNumber: "9999999999",
      paymentInstrument: { type: "PAY_PAGE" }
    };

    const base64Payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64");
    const stringToSign = base64Payload + "/pg/v1/pay" + cfg.saltKey;
    const checksum = crypto.createHash("sha256").update(stringToSign).digest("hex") + "###" + cfg.saltIndex;

    try {
      const res = await axios.post(
        `${cfg.host}/pg/v1/pay`,
        { request: base64Payload },
        {
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
          }
        }
      );
      console.log("SUCCESS! Redirect URL:", res.data?.data?.instrumentResponse?.redirectInfo?.url);
    } catch (err) {
      if (err.response) {
        console.log("Response:", err.response.status, err.response.data);
      } else {
        console.log("Error:", err.message);
      }
    }
  }
}

testCombinations();
