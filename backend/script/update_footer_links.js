/**
 * One-time patch: Elecmoon footer links in storeCustomizationSetting (no pricing).
 * Run: node backend/script/update_footer_links.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Setting = require("../models/Setting");

const footerPatch = {
  block1_title: { en: "General Links", de: "Allgemeine Links" },
  block1_sub_title1: { en: "Home", de: "Startseite" },
  block1_sub_link1: "/",
  block1_sub_title2: { en: "About Us", de: "Über uns" },
  block1_sub_link2: "/about-us",
  block1_sub_title3: { en: "Blog", de: "Blog" },
  block1_sub_link3: "/blog",
  block1_sub_title4: { en: "Contact Us", de: "Kontaktiere uns" },
  block1_sub_link4: "/contact-us",
  block2_title: { en: "Legal & Policies", de: "Rechtliches" },
  block2_sub_title1: { en: "Privacy Policy", de: "Datenschutz" },
  block2_sub_link1: "/privacy-policy",
  block2_sub_title2: { en: "Terms & Conditions", de: "AGB" },
  block2_sub_link2: "/terms-and-conditions",
  block2_sub_title3: { en: "Shipping Policy", de: "Versand" },
  block2_sub_link3: "/shipping-policy",
  block2_sub_title4: { en: "Return & Refund Policy", de: "Rückgabe" },
  block2_sub_link4: "/return-and-refund-policy",
  block1_status: true,
  block2_status: true,
};

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGO_URI not set in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const doc = await Setting.findOne({ name: "storeCustomizationSetting" });
  if (!doc) {
    console.error("storeCustomizationSetting not found in DB");
    process.exit(1);
  }

  doc.setting.footer = { ...(doc.setting.footer || {}), ...footerPatch };
  doc.markModified("setting");
  await doc.save();

  console.log("Footer blocks 1 & 2 updated (Pricing removed, Elecmoon links set).");
  console.log("Admin can edit anytime: Online Store → Store Customization → Footer");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
