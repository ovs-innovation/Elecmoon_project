const axios = require("axios");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function testClientId() {
  const merchantId = "SU2607281208295158372867";
  const saltKey = "7b298a23-787d-4909-9ee6-a5fcb8d5711e";
  const saltIndex = "1";
  const hostUrl = "https://api.phonepe.com/apis/hermes";

  console.log(`Testing PhonePe Live API with Merchant ID: ${merchantId}`);
  const merchantTransactionId = `MT_${Date.now()}`;
  const payloadObj = {
    merchantId,
    merchantTransactionId,
    merchantUserId: "USER_123",
    amount: 100, // 1.00 INR
    redirectUrl: "http://localhost:8083/api/order/phonepe/callback?txId=" + merchantTransactionId,
    redirectMode: "POST",
    callbackUrl: "http://localhost:8083/api/order/phonepe/webhook",
    mobileNumber: "9999999999",
    paymentInstrument: { type: "PAY_PAGE" }
  };

  const base64Payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64");
  const stringToSign = base64Payload + "/pg/v1/pay" + saltKey;
  const checksum = crypto.createHash("sha256").update(stringToSign).digest("hex") + "###" + saltIndex;

  try {
    const res = await axios.post(
      `${hostUrl}/pg/v1/pay`,
      { request: base64Payload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
        }
      }
    );
    console.log("SUCCESS! PhonePe Live Response:", JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.log("PhonePe Response Error Status:", err.response.status, JSON.stringify(err.response.data, null, 2));
    } else {
      console.log("Error:", err.message);
    }
  }
}

testClientId();
