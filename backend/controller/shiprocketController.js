const FulfillmentQueueService = require("../services/shipping/FulfillmentQueueService");
const ShiprocketHealthMonitor = require("../services/monitoring/ShiprocketHealthMonitor");
const ShiprocketService = require("../services/shipping/ShiprocketService");
const ShipmentFulfillmentService = require("../services/shipping/ShipmentFulfillmentService");
const ShippingJob = require("../models/ShippingJob");

/**
 * GET /api/orders/shipping/monitor
 */
const getShippingMonitor = async (req, res) => {
  try {
    const [stats, recentJobs] = await Promise.all([
      FulfillmentQueueService.getQueueStats(),
      ShippingJob.find({})
        .sort({ updatedAt: -1 })
        .limit(30)
        .select("order orderId source status attempts lastError nextAttemptAt updatedAt createdAt")
        .lean(),
    ]);

    return res.status(200).send({
      health: ShiprocketHealthMonitor.snapshot(),
      configured: ShiprocketService.isConfigured(),
      stats,
      recentJobs,
    });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

/**
 * GET /api/orders/shipping/failed
 */
const listFailedFulfillments = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const orders = await FulfillmentQueueService.listFailedOrders({ limit });
    return res.status(200).send({ count: orders.length, orders });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

/**
 * POST /api/orders/shipping/failed/:id/retry
 */
const retryFailedFulfillment = async (req, res) => {
  try {
    const actor = req.user?.email || req.user?.name || "admin";
    const job = await FulfillmentQueueService.retryFailedOrder(
      req.params.id,
      actor
    );
    // Also drain immediately for faster UX
    FulfillmentQueueService.drain({ limit: 3 }).catch(() => null);
    return res.status(200).send({
      message: "Fulfillment re-queued",
      job,
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).send({ message: err.message });
  }
};

/**
 * GET /api/orders/shipping/dlq
 */
const listDeadLetters = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const status = req.query.status || "open";
    const items = await FulfillmentQueueService.listDlq({ limit, status });
    return res.status(200).send({ count: items.length, items });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

/**
 * POST /api/orders/shipping/dlq/:id/requeue
 */
const requeueDeadLetter = async (req, res) => {
  try {
    const actor = req.user?.email || req.user?.name || "admin";
    const result = await FulfillmentQueueService.requeueDlq(
      req.params.id,
      actor
    );
    FulfillmentQueueService.drain({ limit: 3 }).catch(() => null);
    return res.status(200).send({
      message: "DLQ item re-queued",
      ...result,
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).send({ message: err.message });
  }
};

/**
 * Admin create / resume — always resumeSteps so AWB/pickup can finish.
 */
const createShiprocketOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const fulfilled = await ShipmentFulfillmentService.fulfillOrder(id, {
      source: "admin",
      resumeSteps: true,
    });

    if (fulfilled?.skipped) {
      return res.status(200).send({
        message: `Skipped: ${fulfilled.skipReason}`,
        order: serializeShipment(fulfilled),
      });
    }

    return res.status(200).send({
      message: "Shiprocket fulfillment completed",
      order: serializeShipment(fulfilled),
    });
  } catch (err) {
    ShiprocketService.log("Error", {
      event: "admin_fulfill",
      message: err.message,
      data: err.data,
    });
    const status =
      err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
    return res.status(status).send({
      message: err.message,
      errorDetails: err.data || undefined,
    });
  }
};

const handleShiprocketWebhook = async (req, res) => {
  try {
    const providedSecret =
      req.headers["x-api-key"] ||
      req.headers["x-shiprocket-token"] ||
      req.headers["x-webhook-secret"] ||
      req.body?.webhook_secret;

    ShiprocketService.verifyWebhookSecret(providedSecret);

    const result = await ShipmentFulfillmentService.applyWebhook(req.body || {});

    if (result?.duplicate) {
      return res.status(200).send({
        message: "Duplicate webhook ignored",
        duplicate: true,
        orderId: result.orderId || result.order?.orderId,
        deliveryStatus: result.deliveryStatus || result.order?.deliveryStatus,
      });
    }

    return res.status(200).send({
      message: "Webhook processed successfully",
      orderId: result.orderId,
      deliveryStatus: result.deliveryStatus,
    });
  } catch (err) {
    ShiprocketService.log("WebhookError", {
      message: err.message,
      status: err.status,
    });
    const status =
      err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
    return res.status(status).send({ message: err.message });
  }
};

const getShipmentTracking = async (req, res) => {
  try {
    const Order = require("../models/Order");
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).send({ message: "Order not found" });
    }

    const isAdmin = req.user?.type === "admin" || req.user?.role === "admin";
    if (!isAdmin && req.user?._id && String(order.user) !== String(req.user._id)) {
      return res.status(403).send({
        message: "You are not authorized to track this order.",
      });
    }

    const tracking = await ShipmentFulfillmentService.getTrackingForOrder(order);
    return res.status(200).send({
      orderId: order.orderId,
      ...tracking,
    });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

function serializeShipment(order) {
  return {
    _id: order._id,
    orderId: order.orderId,
    shiprocketOrderId: order.shiprocketOrderId,
    shiprocketShipmentId: order.shiprocketShipmentId,
    shiprocketStatus: order.shiprocketStatus,
    awbCode: order.awbCode,
    courierName: order.courierName,
    trackingUrl: order.trackingUrl,
    deliveryStatus: order.deliveryStatus,
    shiprocketPickupScheduled: order.shiprocketPickupScheduled,
    shiprocketFulfillmentStatus: order.shiprocketFulfillmentStatus,
    shiprocketFulfillmentError: order.shiprocketFulfillmentError,
    skipped: order.skipped || false,
    skipReason: order.skipReason || undefined,
  };
}

module.exports = {
  createShiprocketOrder,
  handleShiprocketWebhook,
  getShipmentTracking,
  getShippingMonitor,
  listFailedFulfillments,
  retryFailedFulfillment,
  listDeadLetters,
  requeueDeadLetter,
};
