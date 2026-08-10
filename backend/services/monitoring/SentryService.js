const Sentry = require("@sentry/node");

/**
 * Thin Sentry wrapper — no-ops when SENTRY_DSN is unset.
 */
class SentryService {
  constructor() {
    this.enabled = false;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    const dsn = String(process.env.SENTRY_DSN || "").trim();
    if (!dsn) {
      console.log("[Sentry] disabled (SENTRY_DSN not set)");
      return;
    }

    Sentry.init({
      dsn,
      environment:
        process.env.SENTRY_ENVIRONMENT ||
        process.env.NODE_ENV ||
        "production",
      release: process.env.SENTRY_RELEASE || undefined,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.05),
    });
    this.enabled = true;
    console.log("[Sentry] initialized");
  }

  captureException(err, context = {}) {
    if (!this.enabled) {
      console.error("[Sentry][capture-skipped]", err?.message || err, context);
      return;
    }
    Sentry.withScope((scope) => {
      if (context.tags) {
        Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, v));
      }
      if (context.extra) scope.setExtras(context.extra);
      if (context.level) scope.setLevel(context.level);
      Sentry.captureException(err);
    });
  }

  captureMessage(message, context = {}) {
    if (!this.enabled) {
      console.warn("[Sentry][message-skipped]", message, context);
      return;
    }
    Sentry.withScope((scope) => {
      if (context.tags) {
        Object.entries(context.tags).forEach(([k, v]) => scope.setTag(k, v));
      }
      if (context.extra) scope.setExtras(context.extra);
      Sentry.captureMessage(message, context.level || "warning");
    });
  }

  getRequestHandler() {
    return this.enabled && Sentry.Handlers
      ? Sentry.Handlers.requestHandler()
      : null;
  }

  getErrorHandler() {
    return this.enabled && Sentry.Handlers
      ? Sentry.Handlers.errorHandler()
      : null;
  }
}

module.exports = new SentryService();
