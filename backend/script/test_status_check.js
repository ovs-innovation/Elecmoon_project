const axios = require("axios");
const crypto = require("crypto");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function testStatusCheck() {
  const merchantId = process.env.PHONEPE_MERCHANT_ID;
  const saltKey = process.env.PHONEPE_SALT_KEY;
  const saltIndex = process.env.PHONEPE_SALT_INDEX;

  const merchantTransactionId = "MT_TEST_123";
  const endpoint = `/pg/v1/status/${merchantId}/${merchantTransactionId}`;
  const checksum = crypto.createHash("sha256").update(endpoint + saltKey).digest("hex") + "###" + saltIndex;

  const hosts = [
    "https://api.phonepe.com/apis/hermes",
    "https://api-preprod.phonepe.com/apis/pg-sandbox"
  ];

  for (const host of hosts) {
    console.log(`\nTesting GET ${host}${endpoint} ...`);
    try {
      const res = await axios.get(`${host}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          "X-MERCHANT-ID": merchantId,
          "X-VERIFY": checksum
        }
      });
      console.log(`Response from ${host}:`, res.data);
    } catch (err) {
      if (err.response) {
        console.log(`Response ${err.response.status} from ${host}:`, JSON.stringify(err.response.data, null, 2));
      } else {
        console.log(`Error from ${host}:`, err.message);
      }
    }
  }
}

testStatusCheck();
