require("dotenv").config();
const { connectDB } = require("../config/db");
const Setting = require("../models/Setting");

const LINK_KEYS = [
  "first_link",
  "second_link",
  "third_link",
  "four_link",
  "five_link",
];

const LEGACY =
  /milk-dairy|fish-meat|fruits-vegetable|fresh-vegetable|beauty-health|breakfast|soft-drink|baby-care|categories\//i;

const fixSliderLinks = async () => {
  await connectDB();

  const setting = await Setting.findOne({ name: "storeCustomizationSetting" });
  if (!setting) {
    console.log("storeCustomizationSetting not found");
    process.exit(1);
  }

  const slider = setting.setting?.slider || {};
  let changed = 0;

  for (const key of LINK_KEYS) {
    const current = slider[key];
    if (!current || LEGACY.test(String(current))) {
      console.log(`${key}: "${current}" → "/#categories"`);
      slider[key] = "/#categories";
      changed += 1;
    } else {
      console.log(`${key}: keep "${current}"`);
    }
  }

  if (changed) {
    setting.setting.slider = slider;
    setting.markModified("setting");
    await setting.save();
    console.log(`\n✅ Updated ${changed} slider links`);
  } else {
    console.log("\nNo slider links needed updating");
  }

  process.exit(0);
};

fixSliderLinks().catch((e) => {
  console.error(e);
  process.exit(1);
});
