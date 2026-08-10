const crypto = require("crypto");
const Order = require("../../models/Order");
const Product = require("../../models/Product");
const WebhookIdempotency = require("../../models/WebhookIdempotency");
const ShiprocketService = require("./ShiprocketService");
const SentryService = require("../monitoring/SentryService");
const { isOrderBlockedForFulfillment } = require("./fulfillmentGuards");

const LOCK_STALE_MS = 10 * 60 * 1000;

const DELIVERY_STATUS_MAP = {
  new: "Pending",
  created: "Pending",
  pending: "Pending",
  "pickup scheduled": "Ready To Ship",
  "pickup generated": "Ready To Ship",
  "ready to ship": "Ready To Ship",
  packed: "Ready To Ship",
  shipped: "Shipped",
  "in transit": "In Transit",
  "out for delivery": "Out For Delivery",
  delivered: "Delivered",
  canceled: "Cancelled",
  cancelled: "Cancelled",
  rto: "Returned",
  "rto initiated": "Returned",
  returned: "Returned",
  lost: "Cancelled",
};

class ShipmentFulfillmentService {
  /**
   * Enqueue durable job (preferred). Never throws into payment flow.
   */
  queueFulfillment(orderId, reason = "auto") {
    if (!orderId) return;
    if (!ShiprocketService.isConfigured()) {
      ShiprocketService.log("Skip", {
        orderId: String(orderId),
        reason: "not_configured",
      });
      return;
    }
    if (
      !ShiprocketService.getConfig().autoFulfill &&
      (reason === "auto" || reason === "paid" || reason === "cod" || reason === "paid-retry")
    ) {
      ShiprocketService.log("Skip", {
        orderId: String(orderId),
        reason: "auto_fulfill_disabled",
      });
      return;
    }

    setImmediate(() => {
      const FulfillmentQueueService = require("./FulfillmentQueueService");
      FulfillmentQueueService.enqueue(orderId, reason).catch((err) => {
        ShiprocketService.log("QueueEnqueueError", {
          orderId: String(orderId),
          message: err.message,
        });
        SentryService.captureException(err, {
          tags: { component: "shiprocket_queue" },
          extra: { orderId: String(orderId), reason },
        });
      });
    });
  }

  /**
   * Full pipeline with per-step atomic claims.
   *
   * - If shiprocketShipmentId already exists and resumeSteps=false → skip entire fulfillment
   * - Never create order twice / assign AWB twice / generate pickup twice
   */
  async fulfillOrder(orderId, { source = "manual", resumeSteps = false } = {}) {
    let order = await Order.findById(orderId);
    if (!order) {
      throw Object.assign(new Error("Order not found"), { status: 404 });
    }

    if (!ShiprocketService.isConfigured()) {
      throw Object.assign(new Error("Shiprocket is not configured"), {
        status: 503,
      });
    }

    if (isOrderBlockedForFulfillment(order)) {
      ShiprocketService.log("Skip", {
        orderId: order.orderId,
        reason: "order_cancelled_or_refunded",
        source,
        paymentStatus: order.paymentStatus,
        status: order.status,
      });
      return {
        ...(order.toObject ? order.toObject() : order),
        skipped: true,
        skipReason: "order_cancelled_or_refunded",
      };
    }

    // Fully complete → idempotent no-op
    if (
      order.shiprocketShipmentId &&
      order.awbCode &&
      order.shiprocketPickupScheduled
    ) {
      ShiprocketService.log("Skip", {
        orderId: order.orderId,
        reason: "already_completed",
        source,
      });
      if (order.shiprocketFulfillmentStatus !== "COMPLETED") {
        order = await Order.findByIdAndUpdate(
          order._id,
          {
            $set: {
              shiprocketFulfillmentStatus: "COMPLETED",
              shiprocketFulfillmentError: "",
            },
          },
          { new: true }
        );
      }
      return {
        ...(order.toObject ? order.toObject() : order),
        skipped: true,
        skipReason: "already_completed",
      };
    }

    // Requirement: never start a fresh create/fulfill pass when shipment exists
    // unless this is an explicit resume (AWB / pickup only).
    if (order.shiprocketShipmentId && !resumeSteps) {
      ShiprocketService.log("Skip", {
        orderId: order.orderId,
        reason: "shiprocketShipmentId_exists",
        source,
      });
      return {
        ...(order.toObject ? order.toObject() : order),
        skipped: true,
        skipReason: "shiprocketShipmentId_exists",
      };
    }

    ShiprocketService.log("FulfillStart", {
      orderId: order.orderId,
      mongoId: String(order._id),
      source,
      resumeSteps,
      existingShipment: order.shiprocketShipmentId || null,
      existingAwb: order.awbCode || null,
    });

    try {
      await this.markProcessing(order._id);

      if (!order.shiprocketShipmentId) {
        await this.createAdhocForOrderAtomic(order._id);
        order = await Order.findById(order._id);
      }

      if (order.shiprocketShipmentId && !order.awbCode) {
        await this.assignAwbForOrderAtomic(order._id);
        order = await Order.findById(order._id);
      }

      if (
        order.shiprocketShipmentId &&
        order.awbCode &&
        !order.shiprocketPickupScheduled
      ) {
        await this.schedulePickupForOrderAtomic(order._id);
        order = await Order.findById(order._id);
      }

      const nextDelivery =
        order.awbCode &&
        (!order.deliveryStatus ||
          ["Pending", "Ready To Ship"].includes(order.deliveryStatus))
          ? "Shipped"
          : order.deliveryStatus || (order.awbCode ? "Shipped" : "Ready To Ship");

      order = await Order.findByIdAndUpdate(
        order._id,
        {
          $set: {
            shiprocketFulfillmentStatus: "COMPLETED",
            shiprocketFulfillmentError: "",
            deliveryStatus: nextDelivery,
          },
        },
        { new: true }
      );

      ShiprocketService.log("FulfillComplete", {
        orderId: order.orderId,
        shiprocketOrderId: order.shiprocketOrderId,
        shipmentId: order.shiprocketShipmentId,
        awbCode: order.awbCode,
        courierName: order.courierName,
        source,
      });

      return order;
    } catch (err) {
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          shiprocketFulfillmentStatus: "FAILED",
          shiprocketFulfillmentError: summarizeError(err),
        },
      });
      SentryService.captureException(err, {
        tags: { component: "shiprocket_fulfillment" },
        extra: { orderId: String(orderId), source },
      });
      throw err;
    }
  }

  async markProcessing(orderMongoId) {
    const staleBefore = new Date(Date.now() - LOCK_STALE_MS);
    const claimed = await Order.findOneAndUpdate(
      {
        _id: orderMongoId,
        $or: [
          { shiprocketFulfillmentStatus: { $in: ["IDLE", "FAILED", null] } },
          { shiprocketFulfillmentStatus: { $exists: false } },
          {
            shiprocketFulfillmentStatus: "PROCESSING",
            shiprocketFulfillmentLockAt: { $lt: staleBefore },
          },
          {
            shiprocketFulfillmentStatus: "PROCESSING",
            shiprocketFulfillmentLockAt: { $exists: false },
          },
        ],
      },
      {
        $set: {
          shiprocketFulfillmentStatus: "PROCESSING",
          shiprocketFulfillmentLockAt: new Date(),
          shiprocketFulfillmentError: "",
        },
      },
      { new: true }
    );

    if (!claimed) {
      const current = await Order.findById(orderMongoId);
      if (current?.shiprocketFulfillmentStatus === "COMPLETED") {
        return current;
      }
      if (current?.shiprocketFulfillmentStatus === "PROCESSING") {
        throw Object.assign(
          new Error("Fulfillment already in progress"),
          { status: 409, retryable: true }
        );
      }
    }
    return claimed;
  }

  /**
   * Atomically claim create-order step, then call Shiprocket once.
   */
  async createAdhocForOrderAtomic(orderMongoId) {
    const staleBefore = new Date(Date.now() - LOCK_STALE_MS);

    const claimed = await Order.findOneAndUpdate(
      {
        _id: orderMongoId,
        $and: [
          emptyStringOrMissing("shiprocketShipmentId"),
          {
            $or: [
              { shiprocketCreateClaimedAt: { $exists: false } },
              { shiprocketCreateClaimedAt: null },
              { shiprocketCreateClaimedAt: { $lt: staleBefore } },
            ],
          },
        ],
      },
      {
        $set: {
          shiprocketCreateClaimedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!claimed) {
      const current = await Order.findById(orderMongoId);
      if (current?.shiprocketShipmentId) {
        ShiprocketService.log("Skip", {
          orderId: current.orderId,
          step: "create",
          reason: "shipment_already_exists",
        });
        return current;
      }
      throw Object.assign(new Error("Create-order step already claimed"), {
        status: 409,
        retryable: true,
      });
    }

    try {
      const payload = await this.buildAdhocPayload(claimed);

      // Reconcile before create — prior attempt may have succeeded on Shiprocket only
      const preReconciled = await this.reconcileShiprocketOrderToMongo(
        orderMongoId,
        claimed.orderId
      );
      if (preReconciled?.shiprocketShipmentId) {
        return preReconciled;
      }

      const data = await ShiprocketService.createAdhocOrder(payload);

      if (!data?.order_id && !data?.shipment_id) {
        throw Object.assign(
          new Error("Shiprocket create order returned no order/shipment id"),
          { data }
        );
      }

      const updated = await this.persistShiprocketCreateResponse(
        orderMongoId,
        data
      );

      if (!updated) {
        const current = await Order.findById(orderMongoId);
        if (current?.shiprocketShipmentId) return current;

        const reconciled = await this.reconcileShiprocketOrderToMongo(
          orderMongoId,
          claimed.orderId
        );
        if (reconciled?.shiprocketShipmentId) return reconciled;

        throw new Error("Failed to persist shiprocketShipmentId atomically");
      }

      ShiprocketService.log("OrderCreated", {
        orderId: updated.orderId,
        shiprocketOrderId: updated.shiprocketOrderId,
        shipmentId: updated.shiprocketShipmentId,
      });
      return updated;
    } catch (err) {
      // Reconcile on failure — Shiprocket may have created the order already
      const reconciled = await this.reconcileShiprocketOrderToMongo(
        orderMongoId,
        claimed.orderId
      ).catch(() => null);
      if (reconciled?.shiprocketShipmentId) {
        ShiprocketService.log("OrderReconciled", {
          orderId: reconciled.orderId,
          shipmentId: reconciled.shiprocketShipmentId,
          after: "create_error",
        });
        return reconciled;
      }

      // Release claim so a retry can recreate (only if shipment not saved)
      await Order.findOneAndUpdate(
        {
          _id: orderMongoId,
          $or: [
            { shiprocketShipmentId: { $exists: false } },
            { shiprocketShipmentId: null },
            { shiprocketShipmentId: "" },
          ],
        },
        { $unset: { shiprocketCreateClaimedAt: 1 } }
      );
      throw err;
    }
  }

  async persistShiprocketCreateResponse(orderMongoId, data) {
    return Order.findOneAndUpdate(
      {
        _id: orderMongoId,
        $or: [
          { shiprocketShipmentId: { $exists: false } },
          { shiprocketShipmentId: null },
          { shiprocketShipmentId: "" },
        ],
      },
      {
        $set: {
          shiprocketOrderId: String(data.order_id ?? ""),
          shiprocketShipmentId: String(data.shipment_id ?? ""),
          shiprocketStatus: data.status || data.status_code || "NEW",
        },
      },
      { new: true }
    );
  }

  /**
   * Pull channel order from Shiprocket and persist ids when Mongo is missing them.
   */
  async reconcileShiprocketOrderToMongo(orderMongoId, channelOrderId) {
    const channelId = String(channelOrderId || "").trim();
    if (!channelId || !ShiprocketService.isConfigured()) return null;

    const local = await Order.findById(orderMongoId).select(
      "orderId shiprocketOrderId shiprocketShipmentId"
    );
    if (!local || local.shiprocketShipmentId) return local;

    const remote = await ShiprocketService.searchOrdersByChannelId(channelId);
    const match = extractRemoteOrderMatch(remote, channelId);
    if (!match?.shiprocketShipmentId) return null;

    const updated = await Order.findOneAndUpdate(
      {
        _id: orderMongoId,
        $or: [
          { shiprocketShipmentId: { $exists: false } },
          { shiprocketShipmentId: null },
          { shiprocketShipmentId: "" },
        ],
      },
      {
        $set: {
          shiprocketOrderId: match.shiprocketOrderId,
          shiprocketShipmentId: match.shiprocketShipmentId,
          shiprocketStatus: match.shiprocketStatus || "NEW",
        },
      },
      { new: true }
    );

    if (updated) {
      ShiprocketService.log("OrderReconciled", {
        orderId: updated.orderId,
        shiprocketOrderId: updated.shiprocketOrderId,
        shipmentId: updated.shiprocketShipmentId,
        source: "search",
      });
    }
    return updated || local;
  }

  async assignAwbForOrderAtomic(orderMongoId) {
    const staleBefore = new Date(Date.now() - LOCK_STALE_MS);

    const claimed = await Order.findOneAndUpdate(
      {
        _id: orderMongoId,
        shiprocketShipmentId: { $exists: true, $nin: [null, ""] },
        $and: [
          emptyStringOrMissing("awbCode"),
          {
            $or: [
              { shiprocketAwbClaimedAt: { $exists: false } },
              { shiprocketAwbClaimedAt: null },
              { shiprocketAwbClaimedAt: { $lt: staleBefore } },
            ],
          },
        ],
      },
      { $set: { shiprocketAwbClaimedAt: new Date() } },
      { new: true }
    );

    if (!claimed) {
      const current = await Order.findById(orderMongoId);
      if (current?.awbCode) {
        ShiprocketService.log("Skip", {
          orderId: current.orderId,
          step: "awb",
          reason: "awb_already_exists",
        });
        return current;
      }
      throw Object.assign(new Error("AWB step already claimed or not ready"), {
        status: 409,
        retryable: true,
      });
    }

    try {
      const shipmentId =
        Number(claimed.shiprocketShipmentId) || claimed.shiprocketShipmentId;
      const courierId = process.env.SHIPROCKET_COURIER_ID
        ? Number(process.env.SHIPROCKET_COURIER_ID)
        : undefined;

      const data = await ShiprocketService.assignAwb({ shipmentId, courierId });
      const { awbCode, courierName } = ShiprocketService.extractAwbDetails(data);

      if (!awbCode) {
        throw Object.assign(
          new Error("Shiprocket assign AWB returned no awb_code"),
          { data }
        );
      }

      const updated = await Order.findOneAndUpdate(
        {
          _id: orderMongoId,
          $or: [{ awbCode: { $exists: false } }, { awbCode: null }, { awbCode: "" }],
        },
        {
          $set: {
            awbCode,
            courierName: courierName || "",
            trackingUrl: ShiprocketService.buildTrackingUrl(awbCode),
            shiprocketStatus: "AWB_ASSIGNED",
            deliveryStatus: "Shipped",
          },
        },
        { new: true }
      );

      if (!updated) {
        const current = await Order.findById(orderMongoId);
        if (current?.awbCode) return current;
        throw new Error("Failed to persist awbCode atomically");
      }

      ShiprocketService.log("AwbAssigned", {
        orderId: updated.orderId,
        awbCode: updated.awbCode,
        courierName: updated.courierName,
      });
      return updated;
    } catch (err) {
      await Order.findOneAndUpdate(
        {
          _id: orderMongoId,
          $or: [{ awbCode: { $exists: false } }, { awbCode: null }, { awbCode: "" }],
        },
        { $unset: { shiprocketAwbClaimedAt: 1 } }
      );
      throw err;
    }
  }

  async schedulePickupForOrderAtomic(orderMongoId) {
    const staleBefore = new Date(Date.now() - LOCK_STALE_MS);

    const claimed = await Order.findOneAndUpdate(
      {
        _id: orderMongoId,
        shiprocketShipmentId: { $exists: true, $nin: [null, ""] },
        awbCode: { $exists: true, $nin: [null, ""] },
        shiprocketPickupScheduled: { $ne: true },
        $or: [
          { shiprocketPickupClaimedAt: { $exists: false } },
          { shiprocketPickupClaimedAt: null },
          { shiprocketPickupClaimedAt: { $lt: staleBefore } },
        ],
      },
      { $set: { shiprocketPickupClaimedAt: new Date() } },
      { new: true }
    );

    if (!claimed) {
      const current = await Order.findById(orderMongoId);
      if (current?.shiprocketPickupScheduled) {
        ShiprocketService.log("Skip", {
          orderId: current.orderId,
          step: "pickup",
          reason: "pickup_already_scheduled",
        });
        return current;
      }
      throw Object.assign(new Error("Pickup step already claimed or not ready"), {
        status: 409,
        retryable: true,
      });
    }

    try {
      const shipmentId =
        Number(claimed.shiprocketShipmentId) || claimed.shiprocketShipmentId;
      const data = await ShiprocketService.generatePickup([shipmentId]);

      const updated = await Order.findOneAndUpdate(
        {
          _id: orderMongoId,
          shiprocketPickupScheduled: { $ne: true },
        },
        {
          $set: {
            shiprocketPickupScheduled: true,
            shiprocketStatus:
              data?.pickup_status ||
              data?.status ||
              claimed.shiprocketStatus ||
              "PICKUP_SCHEDULED",
            deliveryStatus: "Shipped",
          },
        },
        { new: true }
      );

      if (!updated) {
        const current = await Order.findById(orderMongoId);
        if (current?.shiprocketPickupScheduled) return current;
        throw new Error("Failed to persist pickup flag atomically");
      }

      ShiprocketService.log("PickupScheduled", {
        orderId: updated.orderId,
        shipmentId: updated.shiprocketShipmentId,
      });
      return updated;
    } catch (err) {
      await Order.findOneAndUpdate(
        {
          _id: orderMongoId,
          shiprocketPickupScheduled: { $ne: true },
        },
        { $unset: { shiprocketPickupClaimedAt: 1 } }
      );
      throw err;
    }
  }

  async buildAdhocPayload(order) {
    const cfg = ShiprocketService.getConfig();
    const info = order.user_info || {};
    const fullName = String(info.name || "Customer").trim();
    const nameParts = fullName.split(/\s+/);
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "";

    const productMap = await this.loadProductsForCart(order.cart || []);
    const { length, breadth, height, weight } = this.computePackageDimensions(
      order.cart || [],
      productMap,
      cfg.defaults
    );

    const orderItems = (order.cart || []).map((item) => {
      const product = productMap.get(String(item.id || item._id)) || null;
      return {
        name: stringifyTitle(item.title || product?.title),
        sku: item.sku || product?.sku || "N/A",
        units: Number(item.quantity) || 1,
        selling_price: Number(item.price) || 0,
        discount: Number(item.discount) || 0,
        tax: Number(item.tax) || 0,
        hsn: item.hsnCode || item.hsn || product?.hsnCode || "",
      };
    });

    const paymentMethod =
      order.paymentMethod === "Cash" || order.paymentMethod === "COD"
        ? "COD"
        : "Prepaid";

    const state =
      info.state ||
      (info.country && !/^india$/i.test(String(info.country))
        ? info.country
        : "") ||
      "N/A";

    return {
      order_id: String(order.orderId || order._id),
      order_date: new Date(order.createdAt || Date.now())
        .toISOString()
        .split("T")[0],
      pickup_location: cfg.pickupLocation,
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: info.address || "N/A",
      billing_address_2: info.address2 || "",
      billing_city: info.city || "N/A",
      billing_pincode: String(info.zipCode || "").replace(/\D/g, "") || "000000",
      billing_state: state,
      billing_country: "India",
      billing_email: info.email || "customer@example.com",
      billing_phone:
        String(info.contact || "").replace(/\D/g, "").slice(-10) || "0000000000",
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: paymentMethod,
      shipping_charges: Number(order.shippingCost) || 0,
      total_discount: Number(order.discount) || 0,
      sub_total: Number(order.subTotal) || 0,
      length,
      breadth,
      height,
      weight,
    };
  }

  async loadProductsForCart(cart) {
    const ids = [
      ...new Set(
        (cart || [])
          .map((item) => item?.id || item?._id)
          .filter(Boolean)
          .map(String)
      ),
    ];
    if (!ids.length) return new Map();

    const products = await Product.find({ _id: { $in: ids } })
      .select("title sku hsnCode length breadth height weight")
      .lean();

    return new Map(products.map((p) => [String(p._id), p]));
  }

  computePackageDimensions(cart, productMap, defaults) {
    let maxLength = 0;
    let maxBreadth = 0;
    let totalHeight = 0;
    let totalWeight = 0;
    let anyProductDim = false;

    for (const item of cart || []) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const product = productMap.get(String(item.id || item._id));
      const length = numOrNull(item.length ?? product?.length);
      const breadth = numOrNull(item.breadth ?? product?.breadth);
      const height = numOrNull(item.height ?? product?.height);
      const weight = numOrNull(item.weight ?? product?.weight);

      if (length || breadth || height || weight) anyProductDim = true;

      maxLength = Math.max(maxLength, length || 0);
      maxBreadth = Math.max(maxBreadth, breadth || 0);
      totalHeight += (height || 0) * qty;
      totalWeight += (weight || 0) * qty;
    }

    const length = roundDim(maxLength || defaults.length);
    const breadth = roundDim(maxBreadth || defaults.breadth);
    const height = roundDim(
      totalHeight > 0 ? Math.min(totalHeight, 100) : defaults.height
    );
    const weight = roundDim(
      totalWeight > 0 ? totalWeight : defaults.weight,
      3
    );

    if (!anyProductDim) {
      ShiprocketService.log("PackageDefaults", {
        reason: "no_product_dimensions",
        length,
        breadth,
        height,
        weight,
      });
    }

    return { length, breadth, height, weight };
  }

  /**
   * Idempotent webhook apply — duplicate events are acknowledged without re-write storms.
   */
  async applyWebhook(body = {}) {
    const orderId =
      body.order_id ||
      body.sr_order_id ||
      body.orderId ||
      body?.data?.order_id;
    const shipmentId =
      body.shipment_id ||
      body.sr_shipment_id ||
      body.shipmentId ||
      body?.data?.shipment_id;
    const awb =
      body.awb ||
      body.awb_code ||
      body.awbCode ||
      body?.data?.awb ||
      body?.data?.awb_code;
    const statusRaw =
      body.current_status ||
      body.status ||
      body.shipment_status ||
      body?.data?.current_status ||
      "";
    const courierName =
      body.courier_name ||
      body.courier ||
      body?.data?.courier_name ||
      "";

    const eventKey = buildWebhookEventKey({
      orderId,
      shipmentId,
      awb,
      statusRaw,
      body,
    });

    const existingEvent = await WebhookIdempotency.findOne({
      provider: "shiprocket",
      eventKey,
    });
    if (existingEvent) {
      ShiprocketService.log("WebhookDuplicate", { eventKey, orderId, shipmentId });
      const existing = await Order.findOne({
        $or: [
          shipmentId ? { shiprocketShipmentId: String(shipmentId) } : null,
          orderId ? { shiprocketOrderId: String(orderId) } : null,
          orderId ? { orderId: String(orderId) } : null,
          awb ? { awbCode: String(awb) } : null,
        ].filter(Boolean),
      });
      return {
        duplicate: true,
        order: existing,
        orderId: existing?.orderId,
        deliveryStatus: existing?.deliveryStatus,
      };
    }

    const clauses = [];
    if (shipmentId != null && shipmentId !== "") {
      clauses.push({ shiprocketShipmentId: String(shipmentId) });
    }
    if (orderId != null && orderId !== "") {
      clauses.push({ shiprocketOrderId: String(orderId) });
      clauses.push({ orderId: String(orderId) });
    }
    if (awb) clauses.push({ awbCode: String(awb) });

    if (!clauses.length) {
      throw Object.assign(
        new Error("Webhook missing order/shipment identifiers"),
        { status: 400 }
      );
    }

    const setFields = {
      shiprocketLastWebhookAt: new Date(),
      shiprocketLastWebhookKey: eventKey,
    };

    if (statusRaw) {
      setFields.shiprocketStatus = String(statusRaw);
      const mapped = mapDeliveryStatus(statusRaw);
      if (mapped) {
        setFields.deliveryStatus = mapped;
        if (mapped === "Delivered") setFields.status = "Delivered";
      }
    }
    if (courierName) setFields.courierName = String(courierName);
    if (body.tracking_url || body.track_url) {
      setFields.trackingUrl = String(body.tracking_url || body.track_url);
    }

    // Atomic conditional AWB set — never overwrite existing awb with different value blindly
    const order = await Order.findOneAndUpdate(
      { $or: clauses },
      {
        $set: setFields,
        ...(awb
          ? {
              $setOnInsert: {},
            }
          : {}),
      },
      { new: true }
    );

    if (!order) {
      throw Object.assign(new Error("Order not found for this shipment"), {
        status: 404,
      });
    }

    if (awb && !order.awbCode) {
      await Order.findOneAndUpdate(
        {
          _id: order._id,
          $or: [{ awbCode: { $exists: false } }, { awbCode: null }, { awbCode: "" }],
        },
        {
          $set: {
            awbCode: String(awb),
            trackingUrl:
              order.trackingUrl || ShiprocketService.buildTrackingUrl(awb),
          },
        }
      );
    }

    // Record idempotency only after order update succeeds — failed lookups can retry
    try {
      await WebhookIdempotency.create({
        provider: "shiprocket",
        eventKey,
        order: order._id,
        orderId: order.orderId || "",
        statusApplied: String(statusRaw || ""),
        payloadDigest: eventKey,
      });
    } catch (err) {
      if (err?.code === 11000) {
        ShiprocketService.log("WebhookDuplicate", {
          eventKey,
          orderId: order.orderId,
          note: "race_after_apply",
        });
      } else {
        throw err;
      }
    }

    const fresh = await Order.findById(order._id);
    ShiprocketService.log("WebhookApplied", {
      orderId: fresh.orderId,
      shiprocketStatus: fresh.shiprocketStatus,
      deliveryStatus: fresh.deliveryStatus,
      awbCode: fresh.awbCode,
      eventKey,
    });

    return fresh;
  }

  async getTrackingForOrder(order) {
    if (!order?.awbCode) {
      return {
        awbCode: null,
        courierName: order?.courierName || null,
        trackingUrl: order?.trackingUrl || null,
        deliveryStatus: order?.deliveryStatus || null,
        shiprocketStatus: order?.shiprocketStatus || null,
        live: null,
      };
    }

    let live = null;
    try {
      if (ShiprocketService.isConfigured()) {
        live = await ShiprocketService.trackByAwb(order.awbCode);
      }
    } catch (err) {
      ShiprocketService.log("TrackError", {
        orderId: order.orderId,
        awbCode: order.awbCode,
        message: err.message,
      });
    }

    return {
      awbCode: order.awbCode,
      courierName: order.courierName || null,
      trackingUrl:
        order.trackingUrl || ShiprocketService.buildTrackingUrl(order.awbCode),
      deliveryStatus: order.deliveryStatus || null,
      shiprocketStatus: order.shiprocketStatus || null,
      shiprocketOrderId: order.shiprocketOrderId || null,
      shiprocketShipmentId: order.shiprocketShipmentId || null,
      live,
    };
  }
}

/** Mongo helper: field missing / null / empty string */
function emptyStringOrMissing(field) {
  return {
    $or: [
      { [field]: { $exists: false } },
      { [field]: null },
      { [field]: "" },
    ],
  };
}

/** Normalize Shiprocket order search/list payloads */
function extractRemoteOrderMatch(remote, channelOrderId) {
  const rows = Array.isArray(remote?.data)
    ? remote.data
    : Array.isArray(remote?.orders)
      ? remote.orders
      : Array.isArray(remote)
        ? remote
        : [];

  const target = String(channelOrderId || "").trim().toLowerCase();
  for (const row of rows) {
    const channel =
      row.channel_order_id ||
      row.order_id ||
      row.channel_order ||
      row.orderId ||
      "";
    if (
      target &&
      String(channel).trim().toLowerCase() !== target &&
      String(row.id) !== target
    ) {
      continue;
    }

    const shipmentId =
      row.shipment_id ||
      row.shipments?.[0]?.id ||
      row.shipments?.[0]?.shipment_id ||
      row.shipment?.id ||
      "";
    const srOrderId = row.id || row.order_id || row.sr_order_id || "";

    if (shipmentId || srOrderId) {
      return {
        shiprocketOrderId: String(srOrderId || ""),
        shiprocketShipmentId: String(shipmentId || ""),
        shiprocketStatus:
          row.status ||
          row.status_code ||
          row.shipments?.[0]?.status ||
          "NEW",
      };
    }
  }
  return null;
}

function buildWebhookEventKey({ orderId, shipmentId, awb, statusRaw, body }) {
  const explicit =
    body.event_id ||
    body.id ||
    body.webhook_id ||
    body?.data?.event_id ||
    "";
  const material = explicit
    ? String(explicit)
    : [
        orderId || "",
        shipmentId || "",
        awb || "",
        statusRaw || "",
        body.current_timestamp || body.timestamp || body.updated_at || "",
        body.current_status_id || "",
      ].join("|");

  return crypto.createHash("sha256").update(material).digest("hex");
}

function stringifyTitle(title) {
  if (title == null) return "Item";
  if (typeof title === "string") return title;
  if (typeof title === "object") {
    return (
      title.en ||
      title.hi ||
      Object.values(title).find((v) => typeof v === "string" && v.trim()) ||
      "Item"
    );
  }
  return String(title);
}

function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function roundDim(n, places = 2) {
  const f = 10 ** places;
  return Math.max(0.01, Math.round(Number(n) * f) / f);
}

function mapDeliveryStatus(statusRaw) {
  const key = String(statusRaw || "")
    .trim()
    .toLowerCase();
  if (!key) return null;
  if (DELIVERY_STATUS_MAP[key]) return DELIVERY_STATUS_MAP[key];
  for (const [needle, value] of Object.entries(DELIVERY_STATUS_MAP)) {
    if (key.includes(needle)) return value;
  }
  return null;
}

function summarizeError(err) {
  if (!err) return "Unknown error";
  const detail =
    typeof err.data === "string"
      ? err.data
      : err.data
        ? JSON.stringify(err.data).slice(0, 500)
        : "";
  return `${err.message}${detail ? ` | ${detail}` : ""}`.slice(0, 1000);
}

module.exports = new ShipmentFulfillmentService();
