const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { createPhonePePayment } = require("../controller/customerOrderController");

async function testCreatePayment() {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB.");

    const req = {
      headers: {
        host: "localhost:8083",
        "x-forwarded-proto": "http"
      },
      user: null, // Guest checkout test
      body: {
        user_info: {
          name: "Test Customer",
          email: "test@example.com",
          phoneNumber: "9999999999",
          address: "123 Main St",
          city: "New Delhi",
          country: "India",
          zipCode: "110001"
        },
        cart: [
          {
            _id: "6a2001c1c217e200137b805e",
            title: { en: "Test Product" },
            price: 1500,
            quantity: 1,
            variant: {}
          }
        ],
        shippingOption: "Product Delivery",
        discount: 0
      }
    };

    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      send: function(data) {
        console.log(`Response Status ${this.statusCode}:`, data);
        process.exit(0);
      }
    };

    console.log("Testing createPhonePePayment with process.env.PHONEPE_HOST_URL...");
    try {
      await createPhonePePayment(req, res);
    } catch (e) {
      console.log("Caught:", e.message);
    }
  } catch (err) {
    console.error("Test failed with error:", err);
    process.exit(1);
  }
}

testCreatePayment();
