const SentryService = require("./SentryService");

const ALERT_THRESHOLD = Number(process.env.SHIPROCKET_FAIL_ALERT_THRESHOLD) || 5;

/**
 * Tracks consecutive Shiprocket API failures and raises alerts.
 */
class ShiprocketHealthMonitor {
  constructor() {
    this.consecutiveFailures = 0;
    this.totalSuccesses = 0;
    this.totalFailures = 0;
    this.lastFailureAt = null;
    this.lastSuccessAt = null;
    this.lastError = null;
    this.alertRaised = false;
    this.recentEvents = []; // ring buffer
  }

  recordSuccess(label = "request") {
    this.consecutiveFailures = 0;
    this.totalSuccesses += 1;
    this.lastSuccessAt = new Date();
    this.alertRaised = false;
    this.pushEvent({ type: "success", label, at: this.lastSuccessAt });
  }

  recordFailure(label = "request", err) {
    this.consecutiveFailures += 1;
    this.totalFailures += 1;
    this.lastFailureAt = new Date();
    this.lastError = {
      label,
      message: err?.message || String(err),
      status: err?.status || null,
      at: this.lastFailureAt.toISOString(),
    };
    this.pushEvent({
      type: "failure",
      label,
      message: this.lastError.message,
      at: this.lastFailureAt,
    });

    if (
      this.consecutiveFailures >= ALERT_THRESHOLD &&
      !this.alertRaised
    ) {
      this.alertRaised = true;
      const message = `Shiprocket API failed ${this.consecutiveFailures} consecutive times`;
      console.error(`[Shiprocket][ALERT] ${message}`, this.lastError);
      SentryService.captureMessage(message, {
        level: "error",
        tags: { component: "shiprocket", alert: "consecutive_failures" },
        extra: {
          consecutiveFailures: this.consecutiveFailures,
          threshold: ALERT_THRESHOLD,
          lastError: this.lastError,
        },
      });
      if (err) {
        SentryService.captureException(err, {
          tags: { component: "shiprocket", alert: "consecutive_failures" },
          extra: { consecutiveFailures: this.consecutiveFailures },
        });
      }
    }
  }

  pushEvent(event) {
    this.recentEvents.push(event);
    if (this.recentEvents.length > 50) this.recentEvents.shift();
  }

  snapshot() {
    return {
      healthy: this.consecutiveFailures < ALERT_THRESHOLD,
      consecutiveFailures: this.consecutiveFailures,
      alertThreshold: ALERT_THRESHOLD,
      alertActive: this.alertRaised,
      totalSuccesses: this.totalSuccesses,
      totalFailures: this.totalFailures,
      lastSuccessAt: this.lastSuccessAt,
      lastFailureAt: this.lastFailureAt,
      lastError: this.lastError,
      recentEvents: this.recentEvents.slice(-20),
    };
  }
}

module.exports = new ShiprocketHealthMonitor();
