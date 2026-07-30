const axios = require("axios");
const crypto = require("crypto");

async function testUatCredentials() {
  const uatConfigs = [
    {
      name: "Standard UAT PGTESTPAYUAT86",
      merchantId: "PGTESTPAYUAT86",
      saltKey: "9643443e-7ed3-477c-bc92-4984f3556033",
      saltIndex: "1",
      host: "https://api-preprod.phonepe.com/apis/pg-sandbox"
    },
    {
      name: "Standard UAT PGTESTPAYUAT",
      merchantId: "PGTESTPAYUAT",
      saltKey: "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399",
      saltIndex: "1",
      host: "https://api-preprod.phonepe.com/apis/pg-sandbox"
    },
    {
      name: "Standard UAT PGTESTPAYUAT1",
      merchantId: "PGTESTPAYUAT1",
      saltKey: "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399",
      saltIndex: "1",
      host: "https://api-preprod.phonepe.com/apis/pg-sandbox"
    }
  ];

  for (const cfg of uatConfigs) {
    console.log(`\nTesting ${cfg.name} ...`);
    const merchantTransactionId = `MT_${Date.now()}`;
    const payloadObj = {
      merchantId: cfg.merchantId,
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
      console.log(`SUCCESS for ${cfg.name}! Redirect URL:`, res.data?.data?.instrumentResponse?.redirectInfo?.url);
    } catch (err) {
      if (err.response) {
        console.log(`Response ${err.response.status}:`, err.response.data);
      } else {
        console.log(`Error:`, err.message);
      }
    }
  }
}

testUatCredentials();
