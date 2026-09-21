/**
 * Seed starter brands for Shop by Brand / Admin Catalog.
 * Usage: node script/seed_brands.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Brand = require("../models/Brand");

const brands = [
  {
    name: "Texas Instruments",
    slug: "texas-instruments",
    description: "Analog & embedded processing ICs",
  },
  {
    name: "Arduino",
    slug: "arduino",
    description: "Open-source boards and kits",
  },
  {
    name: "Raspberry Pi",
    slug: "raspberry-pi",
    description: "Single-board computers and accessories",
  },
  {
    name: "Espressif",
    slug: "espressif",
    description: "ESP32 / ESP8266 Wi-Fi & Bluetooth SoCs",
  },
  {
    name: "STMicroelectronics",
    slug: "stmicroelectronics",
    description: "Sensors, MCUs and power devices",
  },
  {
    name: "Microchip",
    slug: "microchip",
    description: "PIC / AVR microcontrollers and tools",
  },
];

(async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI missing in .env");
    process.exit(1);
  }

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  let created = 0;
  let skipped = 0;

  for (const b of brands) {
    const existing = await Brand.findOne({
      $or: [{ slug: b.slug }, { name: b.name }],
    });
    if (existing) {
      skipped += 1;
      console.log(`skip: ${b.name}`);
      continue;
    }
    await Brand.create({
      ...b,
      logo: "",
      status: "show",
    });
    created += 1;
    console.log(`add: ${b.name}`);
  }

  const all = await Brand.find({ status: "show" }).sort({ name: 1 });
  console.log(`\nDone. created=${created} skipped=${skipped} showing=${all.length}`);
  all.forEach((b) => console.log(` - ${b.name} (${b.slug})`));

  await mongoose.disconnect();
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
