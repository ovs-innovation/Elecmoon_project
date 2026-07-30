const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { connectDB } = require("../config/db");
const { createPhonePePayment } = require("../controller/customerOrderController");

async function testWithDb() {
  await connectDB();
  const req = {
    headers: {
      host: "localhost:8083",
      "x-forwarded-proto": "http"
    },
    user: null,
    body: {
      user_info: {
        name: "Rohit Sharma",
        email: "rs0043071@gmail.com",
        contact: "9654904742",
        address: "k-9 street. no.2",
        city: "delhi",
        country: "India",
        zipCode: "110055"
      },
      cart: [
        {
          _id: "6a1e8bb7287d5800139f2090",
          id: "6a1e8bb7287d5800139f2090",
          title: "Elecmoon Original JBD BMS LFP 4S 100A",
          price: 1854.96,
          quantity: 1,
          itemTotal: 1854.96
        }
      ],
      shippingOption: "Product Delivery",
      shippingCost: 85,
      discount: 0,
      subTotal: 1854.96,
      total: 1939.96
    }
  };

  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    send: function(data) {
      console.log(`Backend Response Status ${this.statusCode}:`, data);
      process.exit(0);
    }
  };

  await createPhonePePayment(req, res);
}

testWithDb();
