/**
 * Idempotent migration: replace legacy localhost / Vercel / PowerQ URLs
 * in Store Setting documents with production Elecmoon domains.
 *
 * Safe to run on every startup.
 */
require("dotenv").config();

const Setting = require("../models/Setting");

const PROD_API = "https://api.elecmoon.com/api";
const PROD_STORE = "https://elecmoon.com/";
const PROD_ADMIN = "https://admin.elecmoon.com";

const LEGACY_API_URLS = [
  "http://localhost:5055/api",
  "http://localhost:8083/api",
  "http://127.0.0.1:5055/api",
  "http://127.0.0.1:8083/api",
  "https://elecmoon-backend.vercel.app/api",
  "https://Elecmoon-backend-theta.vercel.app/api",
  "https://PowerQ-backend.vercel.app/api",
];

const LEGACY_STORE_URLS = [
  "https://PowerQ-store-nine.vercel.app/",
  "https://PowerQ-store-nine.vercel.app",
  "https://Elecmoon-store-nine.vercel.app/",
  "https://Elecmoon-store-nine.vercel.app",
  "https://elecmoon.vercel.app/",
  "https://elecmoon.vercel.app",
  "https://PowerQ-store.vercel.app/",
  "https://Elecmoon-store.vercel.app/",
];

const LEGACY_ADMIN_URLS = [
  "Elecmoon-admin.vercel.app",
  "https://Elecmoon-admin.vercel.app",
  "PowerQ-admin.vercel.app",
  "https://PowerQ-admin.vercel.app",
  "https://elecmoon.vercel.app/admin",
];

const needsReplace = (value, legacyList, target) => {
  if (!value || typeof value !== "string") return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed === target || trimmed === target.replace(/\/$/, "")) return false;
  if (legacyList.some((u) => trimmed === u || trimmed.startsWith(u.replace(/\/$/, "")))) {
    return true;
  }
  // Any remaining localhost / vercel.app storefront or API
  if (/localhost|127\.0\.0\.1/i.test(trimmed)) return true;
  if (/PowerQ/i.test(trimmed)) return true;
  if (/vercel\.app/i.test(trimmed) && /store|backend|admin/i.test(trimmed)) {
    return true;
  }
  return false;
};

async function migrateStoreSettingUrls() {
  const results = {
    storeSetting: null,
    storeCustomizationSetting: null,
    globalSetting: null,
  };

  // 1) Canonical storeSetting document used by GET /setting/store-setting/all
  const storeSetting = await Setting.findOne({ name: "storeSetting" });
  if (storeSetting?.setting) {
    const s = storeSetting.setting;
    const updates = {};

    if (needsReplace(s.next_api_base_url, LEGACY_API_URLS, PROD_API)) {
      updates["setting.next_api_base_url"] = PROD_API;
    }
    if (needsReplace(s.meta_url, LEGACY_STORE_URLS, PROD_STORE)) {
      updates["setting.meta_url"] = PROD_STORE;
    }
    if (needsReplace(s.website_url, LEGACY_STORE_URLS, PROD_STORE)) {
      updates["setting.website_url"] = PROD_STORE;
    }

    if (Object.keys(updates).length > 0) {
      await Setting.updateOne({ name: "storeSetting" }, { $set: updates });
      results.storeSetting = updates;
      console.log("[Migration] storeSetting updated:", updates);
    } else {
      results.storeSetting = "already_current";
    }
  } else {
    await Setting.findOneAndUpdate(
      { name: "storeSetting" },
      {
        $set: {
          name: "storeSetting",
          setting: {
            next_api_base_url: PROD_API,
            meta_url: PROD_STORE,
            website_url: PROD_STORE,
            cod_status: true,
          },
        },
      },
      { upsert: true }
    );
    results.storeSetting = "created_with_production_urls";
    console.log("[Migration] storeSetting created with production URLs");
  }

  // 2) SEO meta_url lives under storeCustomizationSetting
  const customization = await Setting.findOne({
    name: "storeCustomizationSetting",
  });
  if (customization?.setting?.seo) {
    const metaUrl = customization.setting.seo.meta_url;
    if (needsReplace(metaUrl, LEGACY_STORE_URLS, PROD_STORE)) {
      await Setting.updateOne(
        { name: "storeCustomizationSetting" },
        { $set: { "setting.seo.meta_url": PROD_STORE } }
      );
      results.storeCustomizationSetting = {
        "setting.seo.meta_url": PROD_STORE,
      };
      console.log("[Migration] storeCustomizationSetting.seo.meta_url updated");
    } else {
      results.storeCustomizationSetting = "already_current";
    }
  }

  // 3) globalSetting.website if present
  const globalSetting = await Setting.findOne({ name: "globalSetting" });
  if (globalSetting?.setting?.website) {
    const website = globalSetting.setting.website;
    if (needsReplace(website, LEGACY_ADMIN_URLS, PROD_ADMIN)) {
      await Setting.updateOne(
        { name: "globalSetting" },
        { $set: { "setting.website": PROD_ADMIN } }
      );
      results.globalSetting = { "setting.website": PROD_ADMIN };
      console.log("[Migration] globalSetting.website updated");
    } else {
      results.globalSetting = "already_current";
    }
  }

  return results;
}

module.exports = { migrateStoreSettingUrls, PROD_API, PROD_STORE, PROD_ADMIN };

// Allow: node script/migrate_store_setting_urls.js
if (require.main === module) {
  const { connectDB } = require("../config/db");
  connectDB()
    .then(() => migrateStoreSettingUrls())
    .then((r) => {
      console.log("Migration result:", JSON.stringify(r, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}
