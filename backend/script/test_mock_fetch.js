const axios = require("axios");

async function testMockFetch() {
  try {
    const res = await axios.get("http://localhost:8083/api/order/phonepe/mock-checkout?txId=MT_TEST_123");
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers["content-type"]);
  } catch (err) {
    if (err.response) {
      console.log("Error status:", err.response.status, err.response.data);
    } else {
      console.log("Error:", err.message);
    }
  }
}

testMockFetch();
