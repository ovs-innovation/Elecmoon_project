const ShippingJob = require("../../models/ShippingJob");
const DeadLetterJob = require("../../models/DeadLetterJob");
const Order = require("../../models/Order");
const SentryService = require("../monitoring/SentryService");
const ShiprocketService = require("./ShiprocketService");
const { isOrderBlockedForFulfillment } = require("./fulfillmentGuards");

const LOCK_STALE_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = Number(process.env.SHIPROCKET_JOB_MAX_ATTEMPTS) || 3;

function getQueueConcurrency() {
  return ShiprocketService.getHttpConfig().queueConcurrency;
}

/**
 * Mongo-backed Shiprocket fulfillment queue + dead-letter handling.
 */
class FulfillmentQueueService {
  constructor() {
    this.workerRunning = false;
    this.intervalHandle = null;
    this.inFlight = 0;
  }

  /**
   * Enqueue idempotently — at most one queued/processing job per order.
   */
  async enqueue(orderMongoId, source = "auto", meta = {}) {
    if (!orderMongoId) return null;

    const order = await Order.findById(orderMongoId).select(
      "orderId paymentStatus status shiprocketShipmentId shiprocketFulfillmentStatus awbCode shiprocketPickupScheduled"
    );
    if (!order) return null;

    if (isOrderBlockedForFulfillment(order)) {
      console.log(
        "[Shiprocket][Queue][Skip]",
        JSON.stringify({
          orderId: order.orderId,
          reason: "order_cancelled_or_refunded",
          source,
        })
      );
      return { skipped: true, reason: "order_cancelled_or_refunded" };
    }

    // Fully done → never enqueue again
    if (
      order.shiprocketShipmentId &&
      order.awbCode &&
      order.shiprocketPickupScheduled &&
      order.shiprocketFulfillmentStatus === "COMPLETED"
    ) {
      return { skipped: true, reason: "already_completed" };
    }

    // Duplicate PhonePe storms: shipment already created → do not enqueue another create job
    // unless caller explicitly resumes (admin / retry / dlq) or AWB/pickup still missing.
    const needsResume =
      order.shiprocketShipmentId &&
      (!order.awbCode || !order.shiprocketPickupScheduled);
    if (
      order.shiprocketShipmentId &&
      !needsResume &&
      source !== "admin" &&
      source !== "retry" &&
      source !== "dlq-requeue"
    ) {
      console.log(
        "[Shiprocket][Queue][Skip]",
        JSON.stringify({
          orderId: order.orderId,
          reason: "shiprocketShipmentId_exists",
          source,
        })
      );
      return { skipped: true, reason: "shiprocketShipmentId_exists" };
    }

    try {
      const existingActive = await ShippingJob.findOne({
        order: order._id,
        status: { $in: ["queued", "processing"] },
      });
      if (existingActive) {
        return existingActive;
      }

      const job = await ShippingJob.create({
        order: order._id,
        orderId: order.orderId || "",
        source,
        status: "queued",
        attempts: 0,
        maxAttempts: MAX_ATTEMPTS,
        nextAttemptAt: new Date(),
        meta,
      });
      console.log(
        "[Shiprocket][Queue][Enqueued]",
        JSON.stringify({ jobId: String(job._id), orderId: order.orderId, source })
      );
      return job;
    } catch (err) {
      // Duplicate active job (unique partial index)
      if (err?.code === 11000) {
        const existing = await ShippingJob.findOne({
          order: order._id,
          status: { $in: ["queued", "processing"] },
        });
        console.log(
          "[Shiprocket][Queue][Duplicate]",
          JSON.stringify({
            orderId: order.orderId,
            existingJobId: existing ? String(existing._id) : null,
            source,
          })
        );
        return existing || { skipped: true, reason: "duplicate_active_job" };
      }
      throw err;
    }
  }

  startWorker({ intervalMs = 15_000 } = {}) {
    if (this.intervalHandle) return;
    this.intervalHandle = setInterval(() => {
      this.drain().catch((err) => {
        console.error("[Shiprocket][Queue][DrainError]", err.message);
        SentryService.captureException(err, {
          tags: { component: "shiprocket_queue" },
        });
      });
    }, intervalMs);
    // kick once
    this.drain().catch(() => null);
    console.log("[Shiprocket][Queue] worker started", { intervalMs });
  }

  stopWorker() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  async drain({ limit } = {}) {
    if (this.workerRunning) return { busy: true };
    this.workerRunning = true;
    let processed = 0;
    const batchSize = limit ?? getQueueConcurrency();

    try {
      // Release stale processing locks
      const staleBefore = new Date(Date.now() - LOCK_STALE_MS);
      await ShippingJob.updateMany(
        { status: "processing", lockedAt: { $lt: staleBefore } },
        {
          $set: {
            status: "queued",
            nextAttemptAt: new Date(),
            lastError: "Stale processing lock reclaimed",
          },
          $unset: { lockedAt: 1 },
        }
      );

      const jobs = [];
      for (let i = 0; i < batchSize; i++) {
        const job = await this.claimNextJob();
        if (!job) break;
        jobs.push(job);
      }

      if (jobs.length) {
        await Promise.all(jobs.map((job) => this.processJob(job)));
        processed = jobs.length;
      }
    } finally {
      this.workerRunning = false;
    }

    return { processed };
  }

  async claimNextJob() {
    const now = new Date();
    return ShippingJob.findOneAndUpdate(
      {
        status: "queued",
        nextAttemptAt: { $lte: now },
      },
      {
        $set: {
          status: "processing",
          lockedAt: now,
        },
        $inc: { attempts: 1 },
      },
      { new: true, sort: { nextAttemptAt: 1, createdAt: 1 } }
    );
  }

  async processJob(job) {
    this.inFlight += 1;
    const ShipmentFulfillmentService = require("./ShipmentFulfillmentService");

    try {
      // Manual fulfillment only — never ship from payment/order auto sources
      const autoSources = new Set(["auto", "paid", "cod", "paid-retry"]);
      if (autoSources.has(job.source)) {
        await ShippingJob.findByIdAndUpdate(job._id, {
          $set: {
            status: "skipped",
            completedAt: new Date(),
            lastError: "manual_fulfillment_only",
          },
          $unset: { lockedAt: 1 },
        });
        return;
      }

      const orderSnap = await Order.findById(job.order).select(
        "shiprocketShipmentId awbCode shiprocketPickupScheduled"
      );
      // Resume AWB/pickup when shipment already exists (never recreate order)
      const resumeSteps =
        Boolean(orderSnap?.shiprocketShipmentId) ||
        job.source === "admin" ||
        job.source === "retry" ||
        job.source === "dlq-requeue";

      const result = await ShipmentFulfillmentService.fulfillOrder(job.order, {
        source: job.source,
        resumeSteps,
      });

      await ShippingJob.findByIdAndUpdate(job._id, {
        $set: {
          status: result?.skipped ? "skipped" : "completed",
          completedAt: new Date(),
          lastError: result?.skipReason || "",
        },
        $unset: { lockedAt: 1 },
      });
    } catch (err) {
      const attempts = job.attempts;
      const maxAttempts = job.maxAttempts || MAX_ATTEMPTS;
      const message = err.message || "Fulfillment failed";

      SentryService.captureException(err, {
        tags: { component: "shiprocket_fulfillment" },
        extra: {
          jobId: String(job._id),
          orderId: job.orderId,
          attempts,
        },
      });

      if (attempts >= maxAttempts) {
        await ShippingJob.findByIdAndUpdate(job._id, {
          $set: {
            status: "dead",
            lastError: message,
            completedAt: new Date(),
          },
          $unset: { lockedAt: 1 },
        });
        await DeadLetterJob.create({
          order: job.order,
          orderId: job.orderId,
          source: job.source,
          shippingJob: job._id,
          attempts,
          lastError: message,
          payload: { meta: job.meta },
          status: "open",
        });
        console.error(
          "[Shiprocket][DLQ]",
          JSON.stringify({ orderId: job.orderId, jobId: String(job._id), message })
        );
      } else {
        const delayMs = 30_000 * 2 ** Math.max(0, attempts - 1);
        await ShippingJob.findByIdAndUpdate(job._id, {
          $set: {
            status: "queued",
            lastError: message,
            nextAttemptAt: new Date(Date.now() + delayMs),
          },
          $unset: { lockedAt: 1 },
        });
      }
    } finally {
      this.inFlight = Math.max(0, this.inFlight - 1);
    }
  }

  async getQueueStats() {
    const [
      queued,
      processing,
      completed,
      failed,
      dead,
      skipped,
      openDlq,
      failedOrders,
    ] = await Promise.all([
      ShippingJob.countDocuments({ status: "queued" }),
      ShippingJob.countDocuments({ status: "processing" }),
      ShippingJob.countDocuments({ status: "completed" }),
      ShippingJob.countDocuments({ status: "failed" }),
      ShippingJob.countDocuments({ status: "dead" }),
      ShippingJob.countDocuments({ status: "skipped" }),
      DeadLetterJob.countDocuments({ status: "open" }),
      Order.countDocuments({ shiprocketFulfillmentStatus: "FAILED" }),
    ]);

    return {
      queue: { queued, processing, completed, failed, dead, skipped },
      dlq: { open: openDlq },
      failedOrders,
      inFlight: this.inFlight,
      workerActive: Boolean(this.intervalHandle),
    };
  }

  async listFailedOrders({ limit = 50 } = {}) {
    return Order.find({ shiprocketFulfillmentStatus: "FAILED" })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .select(
        "orderId paymentStatus status deliveryStatus shiprocketOrderId shiprocketShipmentId awbCode courierName shiprocketFulfillmentStatus shiprocketFulfillmentError shiprocketPickupScheduled updatedAt createdAt"
      )
      .lean();
  }

  async listDlq({ limit = 50, status = "open" } = {}) {
    const filter = status ? { status } : {};
    return DeadLetterJob.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async retryFailedOrder(orderMongoId, actor = "admin") {
    await Order.findByIdAndUpdate(orderMongoId, {
      $set: {
        shiprocketFulfillmentStatus: "IDLE",
        shiprocketFulfillmentError: "",
      },
    });
    return this.enqueue(orderMongoId, "retry", { actor });
  }

  async requeueDlq(dlqId, actor = "admin") {
    const dlq = await DeadLetterJob.findById(dlqId);
    if (!dlq) {
      throw Object.assign(new Error("DLQ item not found"), { status: 404 });
    }
    if (dlq.status !== "open") {
      throw Object.assign(new Error(`DLQ item is ${dlq.status}`), { status: 400 });
    }

    await Order.findByIdAndUpdate(dlq.order, {
      $set: {
        shiprocketFulfillmentStatus: "IDLE",
        shiprocketFulfillmentError: "",
      },
    });

    const job = await this.enqueue(dlq.order, "dlq-requeue", {
      actor,
      fromDlq: String(dlq._id),
    });

    dlq.status = "requeued";
    dlq.resolvedAt = new Date();
    dlq.resolvedBy = actor;
    await dlq.save();

    return { dlq, job };
  }
}

module.exports = new FulfillmentQueueService();
