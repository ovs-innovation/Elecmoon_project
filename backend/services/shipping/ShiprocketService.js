const axios = require("axios");
const ShiprocketHealthMonitor = require("../monitoring/ShiprocketHealthMonitor");

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

function readHttpConfig() {
  return {
    timeout: Number(process.env.SHIPROCKET_TIMEOUT) || 30_000,
    maxRetries: Math.max(1, Number(process.env.SHIPROCKET_MAX_RETRY) || 3),
    retryDelayMs: Number(process.env.SHIPROCKET_RETRY_DELAY) || 500,
    queueConcurrency: Math.max(
      1,
      Number(process.env.SHIPROCKET_QUEUE_CONCURRENCY) || 5
    ),
  };
}

/**
 * Low-level Shiprocket External API client.
 * Handles JWT auth (cached ~10 days), retries, and structured logging.
 */
class ShiprocketService {
  constructor() {
    this.tokenCache = {
      token: null,
      expiresAt: 0,
    };
    /** Single in-flight login promise — prevents thundering herd on token refresh */
    this.tokenRefreshPromise = null;
  }

  getHttpConfig() {
    return readHttpConfig();
  }

  getConfig() {
    const email = String(process.env.SHIPROCKET_EMAIL || "").trim();
    const password = String(process.env.SHIPROCKET_PASSWORD || "").trim();
    const pickupLocation =
      String(process.env.SHIPROCKET_PICKUP_LOCATION || "Primary").trim() ||
      "Primary";
    const webhookSecret = String(
      process.env.SHIPROCKET_WEBHOOK_SECRET || ""
    ).trim();
    const enabled =
      String(process.env.SHIPROCKET_ENABLED || "true").toLowerCase() !==
      "false";
    const autoFulfill =
      String(process.env.SHIPROCKET_AUTO_FULFILL || "false").toLowerCase() ===
      "true";

    return {
      email,
      password,
      pickupLocation,
      webhookSecret,
      enabled,
      autoFulfill,
      defaults: {
        length: Number(process.env.SHIPROCKET_DEFAULT_LENGTH) || 10,
        breadth: Number(process.env.SHIPROCKET_DEFAULT_BREADTH) || 15,
        height: Number(process.env.SHIPROCKET_DEFAULT_HEIGHT) || 20,
        weight: Number(process.env.SHIPROCKET_DEFAULT_WEIGHT) || 0.5,
      },
    };
  }

  isConfigured() {
    const { email, password, enabled } = this.getConfig();
    return enabled && Boolean(email && password);
  }

  /**
   * Decode JWT exp (seconds) without verifying signature — used only for cache TTL.
   */
  decodeTokenExpiry(token) {
    try {
      const part = String(token).split(".")[1] || "";
      const padded = part + "=".repeat((4 - (part.length % 4)) % 4);
      const json = Buffer.from(
        padded.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString("utf8");
      const payload = JSON.parse(json);
      if (payload?.exp) return Number(payload.exp) * 1000;
    } catch (_) {
      /* ignore */
    }
    // Fallback: 9 days (token officially valid 10 days)
    return Date.now() + 9 * 24 * 60 * 60 * 1000;
  }

  async getToken({ forceRefresh = false } = {}) {
    const now = Date.now();
    if (
      !forceRefresh &&
      this.tokenCache.token &&
      this.tokenCache.expiresAt > now + 60_000
    ) {
      return this.tokenCache.token;
    }

    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this._fetchAndCacheToken(forceRefresh).finally(
      () => {
        this.tokenRefreshPromise = null;
      }
    );
    return this.tokenRefreshPromise;
  }

  async _fetchAndCacheToken(forceRefresh) {
    if (forceRefresh) {
      this.tokenCache = { token: null, expiresAt: 0 };
    }

    const { email, password } = this.getConfig();
    if (!email || !password) {
      throw new Error(
        "Shiprocket credentials missing. Set SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD."
      );
    }

    const data = await this.request({
      method: "POST",
      path: "/auth/login",
      body: { email, password },
      auth: false,
      label: "auth.login",
    });

    if (!data?.token) {
      throw new Error("Shiprocket login succeeded but no token returned");
    }

    this.tokenCache = {
      token: data.token,
      expiresAt: this.decodeTokenExpiry(data.token),
    };

    this.log("Auth", {
      companyId: data.company_id,
      userId: data.id,
      expiresAt: new Date(this.tokenCache.expiresAt).toISOString(),
    });

    return data.token;
  }

  async createAdhocOrder(payload) {
    return this.authorizedRequest({
      method: "POST",
      path: "/orders/create/adhoc",
      body: payload,
      label: "orders.create.adhoc",
    });
  }

  async assignAwb({ shipmentId, courierId } = {}) {
    const body = { shipment_id: shipmentId };
    if (courierId) body.courier_id = courierId;
    return this.authorizedRequest({
      method: "POST",
      path: "/courier/assign/awb",
      body,
      label: "courier.assign.awb",
    });
  }

  async generatePickup(shipmentIds) {
    const ids = Array.isArray(shipmentIds) ? shipmentIds : [shipmentIds];
    return this.authorizedRequest({
      method: "POST",
      path: "/courier/generate/pickup",
      body: { shipment_id: ids },
      label: "courier.generate.pickup",
    });
  }

  async trackByAwb(awbCode) {
    return this.authorizedRequest({
      method: "GET",
      path: `/courier/track/awb/${encodeURIComponent(awbCode)}`,
      label: "courier.track.awb",
    });
  }

  /**
   * Find an existing Shiprocket order by channel order id (our orderId).
   * Used to reconcile when API create succeeded but MongoDB write failed.
   */
  async searchOrdersByChannelId(channelOrderId) {
    const q = encodeURIComponent(String(channelOrderId || "").trim());
    if (!q) return null;
    return this.authorizedRequest({
      method: "GET",
      path: `/orders?search=${q}&per_page=10`,
      label: "orders.search",
    });
  }

  async authorizedRequest(opts) {
    let token = await this.getToken();
    try {
      return await this.request({ ...opts, token, auth: true });
    } catch (err) {
      if (err.status === 401) {
        this.log("Auth", { event: "token_expired_refresh" });
        token = await this.getToken({ forceRefresh: true });
        return this.request({ ...opts, token, auth: true });
      }
      throw err;
    }
  }

  async request({
    method,
    path,
    body,
    token,
    auth = true,
    label = "request",
  }) {
    const { timeout, maxRetries, retryDelayMs } = this.getHttpConfig();
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const headers = { "Content-Type": "application/json" };
        if (auth && token) headers.Authorization = `Bearer ${token}`;

        const response = await axios({
          method,
          url: `${BASE_URL}${path}`,
          data: body,
          headers,
          timeout,
          validateStatus: () => true,
        });

        if (response.status >= 200 && response.status < 300) {
          if (attempt > 1) {
            this.log("RetrySuccess", { label, attempt, status: response.status });
          }
          if (label !== "auth.login") {
            ShiprocketHealthMonitor.recordSuccess(label);
          }
          return response.data;
        }

        const err = new Error(
          `Shiprocket ${label} failed: HTTP ${response.status}`
        );
        err.status = response.status;
        err.data = response.data;
        err.retryable = response.status >= 500 || response.status === 429;

        if (!err.retryable || attempt === maxRetries) {
          this.log("Error", {
            label,
            attempt,
            status: response.status,
            data: response.data,
          });
          if (label !== "auth.login") {
            ShiprocketHealthMonitor.recordFailure(label, err);
          }
          throw err;
        }

        lastError = err;
        const delay = retryDelayMs * 2 ** (attempt - 1);
        this.log("Retry", { label, attempt, status: response.status, delayMs: delay });
        await sleep(delay);
      } catch (err) {
        if (err.status != null && !err.retryable) throw err;

        const networkRetryable =
          !err.status ||
          err.code === "ECONNABORTED" ||
          err.code === "ETIMEDOUT" ||
          err.code === "ENOTFOUND" ||
          err.message?.includes("Network");

        if (!networkRetryable || attempt === maxRetries) {
          this.log("Error", {
            label,
            attempt,
            message: err.message,
            status: err.status,
            data: err.data,
          });
          if (label !== "auth.login") {
            ShiprocketHealthMonitor.recordFailure(label, err);
          }
          throw err;
        }

        lastError = err;
        const delay = retryDelayMs * 2 ** (attempt - 1);
        this.log("Retry", {
          label,
          attempt,
          message: err.message,
          delayMs: delay,
        });
        await sleep(delay);
      }
    }
    throw lastError || new Error(`Shiprocket ${label} failed after retries`);
  }

  verifyWebhookSecret(providedSecret) {
    const expected = this.getConfig().webhookSecret;
    if (!expected) {
      const err = new Error("Shiprocket webhook secret is not configured");
      err.status = 503;
      throw err;
    }
    if (!providedSecret || providedSecret !== expected) {
      const err = new Error("Unauthorized webhook request");
      err.status = 401;
      throw err;
    }
    return true;
  }

  buildTrackingUrl(awbCode) {
    if (!awbCode) return "";
    return `https://shiprocket.co/tracking/${encodeURIComponent(awbCode)}`;
  }

  /**
   * Normalize Shiprocket assign-AWB response shapes.
   */
  extractAwbDetails(assignResponse) {
    const root = assignResponse?.response?.data || assignResponse?.data || assignResponse || {};
    const awbCode =
      root.awb_code ||
      root.awb ||
      assignResponse?.awb_code ||
      "";
    const courierName =
      root.courier_name ||
      root.courier_company_id ||
      assignResponse?.courier_name ||
      "";
    return {
      awbCode: awbCode ? String(awbCode) : "",
      courierName: courierName ? String(courierName) : "",
      raw: assignResponse,
    };
  }

  log(event, meta = {}) {
    console.log(`[Shiprocket][${event}]`, JSON.stringify(meta));
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = new ShiprocketService();
