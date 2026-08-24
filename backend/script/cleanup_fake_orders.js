/**
 * Backup all orders, then delete every order except the real production ones.
 *
 * Keep: ORD-5BC8271C (invoice 10038), ORD-E6C9BF7D (invoice 10032)
 *
 * Dry run (default):
 *   node script/cleanup_fake_orders.js
 *
 * Execute delete:
 *   node script/cleanup_fake_orders.js --execute
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const ShippingJob = require("../models/ShippingJob");
const DeadLetterJob = require("../models/DeadLetterJob");

const KEEP_ORDER_IDS = ["ORD-5BC8271C", "ORD-E6C9BF7D"];
const KEEP_INVOICES = [10038, 10032];

const EXECUTE = process.argv.includes("--execute");

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI missing in backend/.env");
    process.exit(1);
  }

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const allOrders = await Order.find({}).lean();
  const keepOrders = allOrders.filter(
    (o) =>
      KEEP_ORDER_IDS.includes(o.orderId) ||
      KEEP_INVOICES.includes(Number(o.invoice))
  );
  const deleteOrders = allOrders.filter(
    (o) =>
      !KEEP_ORDER_IDS.includes(o.orderId) &&
      !KEEP_INVOICES.includes(Number(o.invoice))
  );

  if (keepOrders.length === 0) {
    console.error("ERROR: None of the keep orders found in DB. Aborting.");
    await mongoose.disconnect();
    process.exit(1);
  }

  const backupDir = path.join(__dirname, "backups");
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `orders-backup-${stamp}.json`);
  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        total: allOrders.length,
        keepOrderIds: KEEP_ORDER_IDS,
        orders: allOrders,
      },
      null,
      2
    )
  );

  console.log(`Backup saved: ${backupPath}`);
  console.log(`Total orders: ${allOrders.length}`);
  console.log(`Keep (${keepOrders.length}):`);
  keepOrders.forEach((o) =>
    console.log(`  - ${o.orderId} invoice=${o.invoice} status=${o.status}`)
  );
  console.log(`Delete (${deleteOrders.length})`);

  if (!EXECUTE) {
    console.log("\nDry run only. Re-run with --execute to delete fake orders.");
    await mongoose.disconnect();
    return;
  }

  const deleteIds = deleteOrders.map((o) => o._id);
  const keepIds = keepOrders.map((o) => o._id);

  if (deleteIds.length) {
    await ShippingJob.deleteMany({ order: { $in: deleteIds } });
    await DeadLetterJob.deleteMany({ order: { $in: deleteIds } });
    const result = await Order.deleteMany({ _id: { $in: deleteIds } });
    console.log(`Deleted ${result.deletedCount} orders`);
  }

  await Order.updateMany(
    { _id: { $in: keepIds } },
    { $set: { status: "Delivered", deliveryStatus: "Delivered" } }
  );
  console.log("Marked kept orders as Delivered");

  const remaining = await Order.countDocuments();
  console.log(`Orders remaining in DB: ${remaining}`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
