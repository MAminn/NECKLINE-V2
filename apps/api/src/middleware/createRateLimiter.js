const rateLimit = require('express-rate-limit');

// IPv6-safe IP key helper. A raw `req.ip` lets an IPv6 client bypass limits by
// rotating through addresses in their /64; this normalizes to a subnet instead.
const { ipKeyGenerator } = rateLimit;

/**
 * Single source of truth for rate limiters.
 *
 * Cross-cutting behavior — standard headers, IPv6-safe keying, and the 429
 * response shape — is decided here once. Callers supply only policy: the time
 * window, the request ceiling, the user-facing message, an optional error
 * `code`, and an optional custom `keyGenerator` (defaults to per-IP).
 */
function createRateLimiter({ windowMs, max, message, code, keyGenerator } = {}) {
  const missing = ['windowMs', 'max', 'message'].filter(
    (key) => ({ windowMs, max, message })[key] == null,
  );
  if (missing.length > 0) {
    throw new TypeError(
      `createRateLimiter requires windowMs, max, and message (missing: ${missing.join(', ')})`,
    );
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: keyGenerator || ((req) => ipKeyGenerator(req.ip)),
    handler(req, res) {
      res.status(429).json({
        error: true,
        ...(code ? { code } : {}),
        message,
      });
    },
  });
}

module.exports = createRateLimiter;
// Re-exported so callers needing a custom keyGenerator can stay IPv6-safe
// without importing express-rate-limit themselves.
module.exports.ipKeyGenerator = ipKeyGenerator;
