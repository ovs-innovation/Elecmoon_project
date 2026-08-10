const dns = require("node:dns/promises");
dns.setServers(["8.8.8.8", "1.1.1.1"])


require("dotenv").config();

const SentryService = require("../services/monitoring/SentryService");
SentryService.init();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");

const { connectDB } = require("../config/db");
const productRoutes = require("../routes/productRoutes");
const customerRoutes = require("../routes/customerRoutes");
const adminRoutes = require("../routes/adminRoutes");
const orderRoutes = require("../routes/orderRoutes");
const customerOrderRoutes = require("../routes/customerOrderRoutes");
const categoryRoutes = require("../routes/categoryRoutes");
const couponRoutes = require("../routes/couponRoutes");
const attributeRoutes = require("../routes/attributeRoutes");
const settingRoutes = require("../routes/settingRoutes");
const currencyRoutes = require("../routes/currencyRoutes");
const languageRoutes = require("../routes/languageRoutes");
const notificationRoutes = require("../routes/notificationRoutes");
const leadRoutes = require("../routes/leadRoutes");
const blogRoutes = require("../routes/blogRoutes");
const serviceRoutes = require("../routes/serviceRoutes");
const commentRoutes = require("../routes/commentRoutes");
const reviewRoutes = require("../routes/reviewRoutes");
const batteryServiceRoutes = require("../routes/batteryServiceRoutes");
const shortVideoRoutes = require("../routes/shortVideoRoutes");
const { handleShiprocketWebhook } = require("../controller/shiprocketController");
const { getHealth } = require("../controller/healthController");
const { isAuth, isAdmin } = require("../config/auth")

const app = express();

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(503).json({
      message: "Database connection failed",
      error: err.message
    });
  }
});

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

app.use(cors({
  origin: true, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));


//root route
app.get("/", (req, res) => {
  res.send("App works properly!");
});

app.get("/api/health", getHealth);
app.get("/health", getHealth);

//this for route will need for store front, also for admin dashboard
app.use("/api/products/", productRoutes);
app.use("/api/category/", categoryRoutes);
app.use("/api/coupon/", couponRoutes);
app.use("/api/customer/", customerRoutes);
app.use("/api/order/", isAuth, customerOrderRoutes);
app.use("/api/attributes/", attributeRoutes);
app.use("/api/setting/", settingRoutes);
app.use("/api/currency/", currencyRoutes);
app.use("/api/language/", languageRoutes);
app.use("/api/notification/", notificationRoutes);
app.use("/api/leads/", leadRoutes);
app.use("/api/blogs/", blogRoutes);
app.use("/api/services/", serviceRoutes);
app.use("/api/comments/", commentRoutes);
app.use("/api/reviews/", reviewRoutes);
app.use("/api/battery-service/", batteryServiceRoutes);
app.use("/api/short-videos/", shortVideoRoutes);

//if you not use admin dashboard then these two route will not needed.
app.use("/api/admin/", adminRoutes);
app.post("/api/orders/shiprocket/webhook", handleShiprocketWebhook);
app.use("/api/orders/", isAuth, isAdmin, orderRoutes);

// Use express's default error handling middleware
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  try {
    SentryService.captureException(err, { tags: { component: "express" } });
  } catch (_) {
    /* ignore */
  }
  res.status(400).json({ message: err.message });
});

// Serve static files from the "dist" directory
app.use("/static", express.static("public"));

// Serve the index.html file for all routes
// app.get("*", (req, res) => {
//   res.status(404).send("Not Found");
// });


const PORT = process.env.PORT || 5058;

connectDB()
  .then(() => {
    try {
      const PhonePeService = require("../services/payment/PhonePeService");
      PhonePeService.logRuntimeConfig();
    } catch (err) {
      console.warn("[PhonePe] config log skipped:", err.message);
    }

    app.listen(PORT, () => console.log(`server running on port ${PORT}`));

    // Local / long-running process: expire unpaid PhonePe pendings every 5 min.
    // On Vercel, use vercel.json crons hitting /api/order/payments/expire-pending
    if (process.env.VERCEL !== "1") {
      const PendingOrderExpiryService = require("../services/payment/PendingOrderExpiryService");
      const FIVE_MIN = 5 * 60 * 1000;
      setInterval(() => {
        PendingOrderExpiryService.run().catch((err) =>
          console.error("[Payment][Expiry] interval error:", err.message)
        );
      }, FIVE_MIN);
      PendingOrderExpiryService.run().catch(() => null);

      const FulfillmentQueueService = require("../services/shipping/FulfillmentQueueService");
      FulfillmentQueueService.startWorker({
        intervalMs: Number(process.env.SHIPROCKET_QUEUE_INTERVAL_MS) || 15_000,
      });
    }
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    try {
      SentryService.captureException(err, { tags: { component: "startup" } });
    } catch (_) {
      /* ignore */
    }
    process.exit(1);
  });
