const axios = require("axios");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function checkLiveStatus() {
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX;
  const hostUrl = process.env.PHONEPE_HOST_URL || "https://api.phonepe.com/apis/hermes";

  console.log("\n==============================================");
  console.log("   PhonePe Live Activation Checker");
  console.log("==============================================");
  console.log(`Merchant ID : ${merchantId}`);
  console.log(`Target Host : ${hostUrl}`);

  const merchantTransactionId = `MT_CHECK_${Date.now()}`;
  const payloadObj = {
    merchantId,
    merchantTransactionId,
    merchantUserId: "CHECK_USER_1",
    amount: 100, // Rs 1.00
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

    if (res.data?.success && res.data?.data?.instrumentResponse?.redirectInfo?.url) {
      console.log("\n🟢 SUCCESS! YOUR PHONEPE ACCOUNT IS LIVE AND ACTIVE!");
      console.log("Live Payment Redirect URL:", res.data.data.instrumentResponse.redirectInfo.url);
      console.log("Your website will now automatically open the live PhonePe QR/UPI/Card page!");
    } else {
      console.log("\n🟡 Response received:", res.data);
    }
  } catch (err) {
    if (err.response && (err.response.status === 404 || err.response.data?.code === "404")) {
      console.log("\n🔴 STATUS: PENDING ACTIVATION");
      console.log("PhonePe live server responded with 404.");
      console.log("Your merchant account SU2607281208295158372867 is still pending live approval from PhonePe's team.");
    } else if (err.response) {
      console.log("\n🟡 Response status:", err.response.status, err.response.data);
    } else {
      console.log("\n🔴 Error connecting:", err.message);
    }
  }
  console.log("==============================================\n");
}

checkLiveStatus();
