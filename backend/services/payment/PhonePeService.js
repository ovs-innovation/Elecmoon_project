const axios = require("axios");
const crypto = require("crypto");

/**
 * PhonePe PG Standard Checkout V2 client.
 * Auth: OAuth client_credentials → O-Bearer access_token
 */
class PhonePeService {
  constructor() {
    this.tokenCache = {
      accessToken: null,
      expiresAt: 0,
    };
  }

  getConfig() {
    const env = (process.env.PHONEPE_ENV || "production").toLowerCase();
    const isSandbox = env === "sandbox" || env === "uat" || env === "test";

    const clientId = process.env.PHONEPE_CLIENT_ID;
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
    const clientVersion = process.env.PHONEPE_CLIENT_VERSION || "1";
    const merchantId = process.env.PHONEPE_MERCHANT_ID;

    if (!clientId || !clientSecret) {
      throw new Error(
        "PhonePe credentials missing. Set PHONEPE_CLIENT_ID and PHONEPE_CLIENT_SECRET."
      );
    }

    const authBaseUrl =
      process.env.PHONEPE_AUTH_URL ||
      (isSandbox
        ? "https://api-preprod.phonepe.com/apis/pg-sandbox"
        : "https://api.phonepe.com/apis/identity-manager");

    const pgBaseUrl =
      process.env.PHONEPE_PG_URL ||
      (isSandbox
        ? "https://api-preprod.phonepe.com/apis/pg-sandbox"
        : "https://api.phonepe.com/apis/pg");

    return {
      env: isSandbox ? "sandbox" : "production",
      clientId,
      clientSecret,
      clientVersion,
      merchantId,
      authBaseUrl,
      pgBaseUrl,
      webhookUsername: process.env.PHONEPE_WEBHOOK_USERNAME || "",
      webhookPassword: process.env.PHONEPE_WEBHOOK_PASSWORD || "",
    };
  }

  async getAccessToken() {
    const now = Math.floor(Date.now() / 1000);
    if (
      this.tokenCache.accessToken &&
      this.tokenCache.expiresAt > now + 60
    ) {
      return this.tokenCache.accessToken;
    }

    const { clientId, clientSecret, clientVersion, authBaseUrl } =
      this.getConfig();

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("client_version", String(clientVersion));
    params.append("client_secret", clientSecret);
    params.append("grant_type", "client_credentials");

    const response = await axios.post(
      `${authBaseUrl}/v1/oauth/token`,
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        timeout: 20000,
      }
    );

    const accessToken = response.data?.access_token;
    if (!accessToken) {
      throw new Error("PhonePe OAuth failed: access_token missing");
    }

    this.tokenCache = {
      accessToken,
      expiresAt: Number(response.data.expires_at) || now + 3000,
    };

    return accessToken;
  }

  async authHeaders() {
    const token = await this.getAccessToken();
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `O-Bearer ${token}`,
    };
  }

  /**
   * Create PG checkout payment session.
   * @param {{ merchantOrderId: string, amountPaise: number, redirectUrl: string, metaInfo?: object }} params
   */
  async createPayment({ merchantOrderId, amountPaise, redirectUrl, metaInfo }) {
    const { pgBaseUrl } = this.getConfig();
    const headers = await this.authHeaders();

    const payload = {
      merchantOrderId,
      amount: amountPaise,
      expireAfter: 1200,
      metaInfo: metaInfo || undefined,
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Elecmoon order payment",
        merchantUrls: {
          redirectUrl,
        },
      },
    };

    const response = await axios.post(
      `${pgBaseUrl}/checkout/v2/pay`,
      payload,
      { headers, timeout: 30000 }
    );

    return response.data;
  }

  /**
   * Fetch authoritative order status from PhonePe.
   */
  async getOrderStatus(merchantOrderId, { details = true } = {}) {
    const { pgBaseUrl } = this.getConfig();
    const headers = await this.authHeaders();

    const response = await axios.get(
      `${pgBaseUrl}/checkout/v2/order/${encodeURIComponent(
        merchantOrderId
      )}/status`,
      {
        headers,
        params: { details, errorContext: true },
        timeout: 30000,
      }
    );

    return response.data;
  }

  /**
   * Refund-ready API (architecture support).
   */
  async initiateRefund({
    merchantRefundId,
    originalMerchantOrderId,
    amountPaise,
  }) {
    const { pgBaseUrl } = this.getConfig();
    const headers = await this.authHeaders();

    const payload = {
      merchantRefundId,
      originalMerchantOrderId,
      amount: amountPaise,
    };

    const response = await axios.post(
      `${pgBaseUrl}/payments/v2/refund`,
      payload,
      { headers, timeout: 30000 }
    );

    return response.data;
  }

  async getRefundStatus(merchantRefundId) {
    const { pgBaseUrl } = this.getConfig();
    const headers = await this.authHeaders();

    const response = await axios.get(
      `${pgBaseUrl}/payments/v2/refund/${encodeURIComponent(
        merchantRefundId
      )}/status`,
      { headers, timeout: 30000 }
    );

    return response.data;
  }

  /**
   * Verify V2 webhook Authorization header (SHA256 username:password).
   * Rejects when credentials are configured and header does not match.
   */
  verifyWebhookAuthorization(authorizationHeader) {
    const { webhookUsername, webhookPassword } = this.getConfig();

    if (!webhookUsername || !webhookPassword) {
      // Soft-fail only when webhook auth not configured yet —
      // still require status API confirmation before marking paid.
      return { ok: true, configured: false };
    }

    if (!authorizationHeader) {
      return { ok: false, configured: true, reason: "Missing Authorization header" };
    }

    const expected = crypto
      .createHash("sha256")
      .update(`${webhookUsername}:${webhookPassword}`)
      .digest("hex");

    const received = String(authorizationHeader).trim();
    const receivedHex = received.toLowerCase().startsWith("sha256 ")
      ? received.slice(7).trim()
      : received;

    const a = Buffer.from(expected);
    const b = Buffer.from(receivedHex);

    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return { ok: false, configured: true, reason: "Invalid webhook signature" };
    }

    return { ok: true, configured: true };
  }

  normalizeStatus(statusResponse) {
    const state = String(statusResponse?.state || "").toUpperCase();
    const latestAttempt = Array.isArray(statusResponse?.paymentDetails)
      ? statusResponse.paymentDetails[0]
      : null;

    return {
      state,
      isSuccess: state === "COMPLETED",
      isFailed: state === "FAILED",
      isPending: state === "PENDING" || !state,
      phonepeOrderId: statusResponse?.orderId || "",
      phonepeTransactionId: latestAttempt?.transactionId || "",
      paymentMethod: latestAttempt?.paymentMode || "",
      amountPaise: Number(statusResponse?.amount) || 0,
      currency: String(
        statusResponse?.currency || statusResponse?.payableCurrency || "INR"
      ).toUpperCase(),
      merchantId: statusResponse?.merchantId || "",
      failureReason:
        statusResponse?.errorContext?.description ||
        statusResponse?.errorCode ||
        latestAttempt?.errorCode ||
        "",
      raw: statusResponse,
    };
  }
}

module.exports = new PhonePeService();
