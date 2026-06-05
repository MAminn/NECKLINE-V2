const crypto = require('crypto');
const logger = require('../config/logger');

/**
 * Express middleware that captures raw body and verifies Paymob webhook HMAC signature.
 * Must be mounted BEFORE express.json() to preserve raw body bytes.
 *
 * In mock/development mode (PAYMOB_HMAC_SECRET not set), signatures are skipped
 * but a warning is logged.
 */
function verifyPaymobWebhook(req, res, next) {
  const hmacSecret = process.env.PAYMOB_HMAC_SECRET;

  // Collect raw body chunks
  const chunks = [];

  req.on('data', (chunk) => {
    chunks.push(chunk);
  });

  req.on('end', () => {
    const rawBody = Buffer.concat(chunks);
    req.rawBody = rawBody;

    // Parse JSON for downstream handlers
    try {
      req.body = JSON.parse(rawBody.toString('utf8'));
    } catch (err) {
      logger.warn({ err: err.message }, 'Paymob webhook: invalid JSON payload');
      return res.status(400).json({ error: true, message: 'Invalid JSON payload' });
    }

    // Skip verification if no HMAC secret configured (mock/dev mode)
    if (!hmacSecret || hmacSecret.length === 0) {
      logger.warn(
        { path: req.path },
        'Paymob webhook signature verification SKIPPED — PAYMOB_HMAC_SECRET not set'
      );
      return next();
    }

    // Extract signature from headers — Paymob may use different header names
    const signature =
      req.get('x-paymob-signature') ||
      req.get('x-paymob-hmac') ||
      req.get('signature') ||
      '';

    if (!signature) {
      logger.warn({ headers: req.headers }, 'Paymob webhook: missing signature header');
      return res.status(401).json({ error: true, message: 'Missing signature' });
    }

    // Compute expected HMAC-SHA256
    const expected = crypto
      .createHmac('sha256', hmacSecret)
      .update(rawBody)
      .digest('hex');

    // Normalize signature (may be hex or prefixed with "sha256=")
    const provided = signature.replace(/^sha256=/, '').trim();

    // Constant-time comparison to prevent timing attacks
    let valid = false;
    try {
      valid =
        expected.length === provided.length &&
        crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
    } catch {
      valid = false;
    }

    if (!valid) {
      logger.warn(
        { expectedPrefix: expected.slice(0, 8), providedPrefix: provided.slice(0, 8) },
        'Paymob webhook: signature mismatch'
      );
      return res.status(401).json({ error: true, message: 'Invalid signature' });
    }

    logger.info({ path: req.path }, 'Paymob webhook signature verified');
    next();
  });

  req.on('error', (err) => {
    logger.error({ err }, 'Paymob webhook: error reading request body');
    res.status(400).json({ error: true, message: 'Error reading request body' });
  });
}

module.exports = verifyPaymobWebhook;
