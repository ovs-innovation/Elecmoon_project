const axios = require("axios");

async function testCallback() {
  try {
    const res = await axios.get("http://localhost:8083/api/order/phonepe/callback?txId=MT_TEST_123&status=SUCCESS", {
      maxRedirects: 0,
      validateStatus: status => status >= 200 && status < 400
    });
    console.log("Status:", res.status);
    console.log("Redirect Location:", res.headers.location);
  } catch (err) {
    if (err.response) {
      console.log("Response status:", err.response.status, "Location:", err.response.headers.location);
    } else {
      console.log("Error:", err.message);
    }
  }
}

testCallback();
