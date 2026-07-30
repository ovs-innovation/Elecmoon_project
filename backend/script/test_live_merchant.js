const axios = require("axios");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function testLiveMerchant() {
  const merchantId = "M228BKUPOJQVQ";
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX || "1";
  const hostUrl = "https://api.phonepe.com/apis/hermes";

  console.log(`Testing Live Merchant ID: ${merchantId}`);
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
    console.log("SUCCESS! PhonePe Live Response:", res.data);
    if (res.data?.data?.instrumentResponse?.redirectInfo?.url) {
      console.log("REDIRECT URL:", res.data.data.instrumentResponse.redirectInfo.url);
    }
  } catch (err) {
    if (err.response) {
      console.log("PhonePe Response Error Status:", err.response.status, err.response.data);
    } else {
      console.log("Error:", err.message);
    }
  }
}

testLiveMerchant();
