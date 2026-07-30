const axios = require("axios");
const crypto = require("crypto");

async function testIndexes() {
  const merchantId = "PGTESTPAYUAT";
  const saltKey = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
  
  for (let index = 1; index <= 5; index++) {
    console.log(`\nTesting Salt Index ${index} ...`);
    const merchantTransactionId = `MT_${Date.now()}`;
    const payloadObj = {
      merchantId,
      merchantTransactionId,
      merchantUserId: "MUID123",
      amount: 10000,
      redirectUrl: "http://localhost:8083/api/order/phonepe/callback?txId=" + merchantTransactionId,
      redirectMode: "POST",
      callbackUrl: "http://localhost:8083/api/order/phonepe/webhook",
      mobileNumber: "9999999999",
      paymentInstrument: { type: "PAY_PAGE" }
    };

    const base64Payload = Buffer.from(JSON.stringify(payloadObj)).toString("base64");
    const stringToSign = base64Payload + "/pg/v1/pay" + saltKey;
    const checksum = crypto.createHash("sha256").update(stringToSign).digest("hex") + "###" + index;

    try {
      const res = await axios.post(
        "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
        { request: base64Payload },
        {
          headers: {
            "Content-Type": "application/json",
            "X-VERIFY": checksum,
          }
        }
      );
      console.log(`SUCCESS with Index ${index}! Redirect URL:`, res.data?.data?.instrumentResponse?.redirectInfo?.url);
    } catch (err) {
      if (err.response) {
        console.log(`Index ${index} Response:`, err.response.status, err.response.data);
      } else {
        console.log(`Index ${index} Error:`, err.message);
      }
    }
  }
}

testIndexes();
