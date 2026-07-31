const { URL } = require("url");

const DEFAULT_ALLOWED_ORIGINS = [
  "https://elecmoon.com",
  "https://www.elecmoon.com",
  "https://admin.elecmoon.com",
  "https://api.elecmoon.com",
];

/**
 * Validate redirect/callback URLs and request origins for payment flows.
 * Rejects localhost, raw IPs, and unknown hosts in production.
 */
class CallbackSecurity {
  getAllowedOrigins() {
    const fromEnv = (process.env.PAYMENT_ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const storeUrl = process.env.STORE_URL;
    const adminUrl = process.env.ADMIN_URL;
    const apiUrl = process.env.PUBLIC_API_URL || process.env.API_URL;

    const extras = [storeUrl, adminUrl, apiUrl].filter(Boolean);
    return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...fromEnv, ...extras])];
  }

  isLocalhost(hostname) {
    return (
      !hostname ||
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".localhost")
    );
  }

  isIpHostname(hostname) {
    return (
      /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) ||
      hostname.includes(":") // IPv6
    );
  }

  parseUrlSafe(value) {
    try {
      return new URL(value);
    } catch {
      return null;
    }
  }

  originAllowed(originOrUrl) {
    if (!originOrUrl) return false;
    const parsed = this.parseUrlSafe(originOrUrl);
    if (!parsed) return false;

    const allowLocal =
      process.env.PAYMENT_ALLOW_LOCALHOST === "true" ||
      process.env.NODE_ENV !== "production";

    if (this.isLocalhost(parsed.hostname)) {
      return allowLocal;
    }

    if (this.isIpHostname(parsed.hostname)) {
      return false;
    }

    const candidate = `${parsed.protocol}//${parsed.host}`;
    return this.getAllowedOrigins().some((allowed) => {
      const a = this.parseUrlSafe(allowed);
      if (!a) return false;
      return (
        a.protocol === parsed.protocol &&
        a.hostname === parsed.hostname &&
        (a.port === parsed.port || (!a.port && !parsed.port))
      );
    });
  }

  /**
   * Validate browser callback / redirect construction.
   */
  assertSafeRedirectBase(baseUrl) {
    if (!baseUrl || !this.originAllowed(baseUrl)) {
      const err = new Error("Redirect URL is not in the approved whitelist");
      err.code = "UNSAFE_REDIRECT";
      throw err;
    }
    return baseUrl.replace(/\/$/, "");
  }

  /**
   * Soft check for Origin/Referer on authenticated payment create.
   * Does not block missing headers (mobile/native), but rejects bad ones.
   */
  validateRequestOrigins(req) {
    const origin = req.headers.origin;
    const referer = req.headers.referer || req.headers.referrer;

    if (origin && !this.originAllowed(origin)) {
      return { ok: false, reason: `Blocked Origin: ${origin}` };
    }

    if (referer && !this.originAllowed(referer)) {
      return { ok: false, reason: `Blocked Referer: ${referer}` };
    }

    return { ok: true };
  }

  getFrontendBaseUrl(req) {
    const storeUrl = process.env.STORE_URL;
    const allowLocal =
      process.env.PAYMENT_ALLOW_LOCALHOST === "true" ||
      process.env.NODE_ENV !== "production";

    if (storeUrl) {
      try {
        return this.assertSafeRedirectBase(storeUrl);
      } catch (err) {
        if (!allowLocal) throw err;
      }
    }

    if (allowLocal) {
      return "http://localhost:3000";
    }

    throw new Error("STORE_URL must be a whitelisted production URL");
  }

  getBackendBaseUrl(req) {
    const publicApi = process.env.PUBLIC_API_URL || process.env.API_URL;
    if (publicApi) {
      return this.assertSafeRedirectBase(publicApi);
    }

    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const constructed = `${proto}://${host}`;

    const allowLocal =
      process.env.PAYMENT_ALLOW_LOCALHOST === "true" ||
      process.env.NODE_ENV !== "production";

    if (allowLocal && this.isLocalhost(host?.split(":")[0])) {
      return constructed.replace(/\/$/, "");
    }

    return this.assertSafeRedirectBase(constructed);
  }
}

module.exports = new CallbackSecurity();
