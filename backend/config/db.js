require("dotenv").config();
const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

let cachedDb = null;
let isConnecting = false;

const getMongoOptions = () => ({
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
  serverSelectionTimeoutMS: 15000,
});

const connectDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  if (isConnecting) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (mongoose.connection.readyState === 1) {
      cachedDb = mongoose.connection;
      return cachedDb;
    }
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error("MONGO_URI is not set in backend/.env");
  }

  isConnecting = true;
  console.log("Connecting to MongoDB...");

  try {
    cachedDb = await mongoose.connect(uri, getMongoOptions());
    console.log(
      `MongoDB connected | db: ${mongoose.connection.db.databaseName} | host: ${mongoose.connection.host}`
    );

    // Idempotent URL migration (localhost / PowerQ / vercel → production)
    try {
      const {
        migrateStoreSettingUrls,
      } = require("../script/migrate_store_setting_urls");
      await migrateStoreSettingUrls();
    } catch (migErr) {
      console.error("[Migration] store setting URL migrate failed:", migErr.message);
    }

    return cachedDb;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    throw err;
  } finally {
    isConnecting = false;
  }
};

module.exports = {
  connectDB,
};
