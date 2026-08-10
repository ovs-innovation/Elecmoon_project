const mongoose = require("mongoose");
const ShiprocketService = require("../services/shipping/ShiprocketService");
const ShiprocketHealthMonitor = require("../services/monitoring/ShiprocketHealthMonitor");
const FulfillmentQueueService = require("../services/shipping/FulfillmentQueueService");
const SentryService = require("../services/monitoring/SentryService");

/**
 * GET /api/health — public liveness / readiness snapshot
 */
const getHealth = async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbOk = dbState === 1;
  const shiprocket = ShiprocketHealthMonitor.snapshot();
  let queue = null;
  try {
    queue = await FulfillmentQueueService.getQueueStats();
  } catch (err) {
    queue = { error: err.message };
  }

  const configured = ShiprocketService.isConfigured();
  const overallOk =
    dbOk &&
    (!configured || shiprocket.healthy) &&
    !(queue?.dlq?.open > 25);

  const body = {
    status: overallOk ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptimeSec: Math.round(process.uptime()),
    database: {
      connected: dbOk,
      readyState: dbState,
    },
    shiprocket: {
      configured,
      enabled: ShiprocketService.getConfig().enabled,
      autoFulfill: ShiprocketService.getConfig().autoFulfill,
      ...shiprocket,
    },
    queue,
    sentry: { enabled: SentryService.enabled },
  };

  return res.status(overallOk ? 200 : 503).json(body);
};

module.exports = { getHealth };
