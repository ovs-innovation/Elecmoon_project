const axios = require("axios");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function testAllUrls() {
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX;

  const merchantTransactionId = `MT_${Date.now()}`;
  const payloadObj = {
    merchantId,
    merchantTransactionId,
    merchantUserId: "USER_123",
    amount: 167092, // 1670.92 INR in paise
    redirectUrl: "http://localhost:8083/api/order/phonepe/callback?txId=" + merchantTransactionId,
    redirectMode: "POST",
    callbackUrl: "http://localhost:8083/api/order/phonepe/webhook",
    mobileNumber: "9999999999",
    paymentInstrument: {
      type: "PAY_PAGE"
    }
  };

  const base64Payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64");
  const stringToSign = base64Payload + "/pg/v1/pay" + saltKey;
  const checksum = crypto.createHash("sha256").update(stringToSign).digest("hex") + "###" + saltIndex;

  const candidateUrls = [
    "https://api.phonepe.com/apis/hermes",
    "https://api.phonepe.com/apis/pg-sandbox",
    "https://api-preprod.phonepe.com/apis/pg-sandbox",
    "https://api.phonepe.com/apis/identity-v2"
  ];

  for (const host of candidateUrls) {
    console.log(`\nTesting ${host}/pg/v1/pay ...`);
    try {
      const res = await axios.post(
        `${host}/pg/v1/pay`,
        { request: base64Payload },
        {
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
          }
        }
      );
      console.log(`SUCCESS from ${host}:`, JSON.stringify(res.data, null, 2));
    } catch (err) {
      if (err.response) {
        console.log(`Response ${err.response.status} from ${host}:`, JSON.stringify(err.response.data, null, 2));
      } else {
        console.log(`Error from ${host}:`, err.message);
      }
    }
  }
}

testAllUrls();
