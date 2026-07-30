const axios = require("axios");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function testAllRoutes() {
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX;

  const merchantTransactionId = `MT_${Date.now()}`;
  const payloadObj = {
    merchantId,
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

  const endpoints = [
    { host: "https://api.phonepe.com", path: "/apis/hermes/pg/v1/pay" },
    { host: "https://api.phonepe.com", path: "/apis/hermes/pg/v2/pay" },
    { host: "https://api.phonepe.com", path: "/apis/pg-sandbox/pg/v1/pay" },
    { host: "https://api.phonepe.com", path: "/pg/v1/pay" },
    { host: "https://api-preprod.phonepe.com", path: "/apis/pg-sandbox/pg/v1/pay" },
    { host: "https://api-preprod.phonepe.com", path: "/apis/merchant-simulator/pg/v1/pay" }
  ];

  for (const ep of endpoints) {
    const stringToSign = base64Payload + ep.path + saltKey;
    const checksum = crypto.createHash("sha256").update(stringToSign).digest("hex") + "###" + saltIndex;
    const fullUrl = ep.host + ep.path;

    console.log(`\nTesting POST ${fullUrl} ...`);
    try {
      const res = await axios.post(
        fullUrl,
        { request: base64Payload },
        {
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
          }
        }
      );
      console.log(`SUCCESS from ${fullUrl}:`, res.data);
    } catch (err) {
      if (err.response) {
        console.log(`Response ${err.response.status} from ${fullUrl}:`, JSON.stringify(err.response.data));
      } else {
        console.log(`Error from ${fullUrl}:`, err.message);
      }
    }
  }
}

testAllRoutes();
