const IdempotencyKey = require('../models/IdempotencyKey');
const logger = require('../config/logger');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_RESERVE_ATTEMPTS = 3;
const RESERVE_RETRY_DELAY_MS = 50;

const IN_PROGRESS_BODY = {
  error: true,
  message: 'A request with this Idempotency-Key is already being processed',
  code: 'IDEMPOTENCY_IN_PROGRESS',
};

/**
 * Atomically reserve the key using a unique-index insert. Only one concurrent inserter
 * can win. If the reservation vanishes between our failed insert and the lookup (the
 * original request released it after a non-2xx), the slot is free again — re-attempt a
 * few times before giving up so a transient release doesn't turn into a spurious 409.
 *
 * Returns a tagged outcome the middleware dispatches on:
 *   { outcome: 'reserved' }                          — we own the key, run the handler
 *   { outcome: 'replay', statusCode, response }      — original completed, replay it
 *   { outcome: 'in_progress' }                       — original still in flight, reject 409
 *   { outcome: 'error', err }                        — non-duplicate DB error, pass to next()
 */
async function reserveKey(key) {
  for (let attempt = 1; attempt <= MAX_RESERVE_ATTEMPTS; attempt += 1) {
    try {
      await IdempotencyKey.create({ key, status: 'in_progress' });
      return { outcome: 'reserved' };
    } catch (err) {
      if (!err || err.code !== 11000) {
        return { outcome: 'error', err };
      }

      let existing;
      try {
        existing = await IdempotencyKey.findOne({ key }).lean();
      } catch (lookupErr) {
        return { outcome: 'error', err: lookupErr };
      }

      if (existing) {
        return existing.status === 'completed'
          ? { outcome: 'replay', statusCode: existing.statusCode || 200, response: existing.response }
          : { outcome: 'in_progress' };
      }

      // existing === null: the reservation was released between our insert and lookup.
      // Back off briefly, then retry.
      if (attempt < MAX_RESERVE_ATTEMPTS) {
        await sleep(RESERVE_RETRY_DELAY_MS);
      }
    }
  }

  // Reservation stayed contended across every attempt — treat as in-flight.
  return { outcome: 'in_progress' };
}

/**
 * Wrap res.json so the reservation is filled with the response on a 2xx, or released
 * on a non-2xx so the client can retry a genuine failure.
 */
function persistResponseOnFinish(res, key) {
  const originalJson = res.json.bind(res);

  res.json = function patchedJson(body) {
    const statusCode = res.statusCode;

    if (statusCode >= 200 && statusCode < 300) {
      IdempotencyKey.findOneAndUpdate(
        { key },
        { status: 'completed', statusCode, response: body }
      ).catch((err) => {
        logger.error({ err, key }, 'Failed to persist idempotency response');
      });
    } else {
      IdempotencyKey.deleteOne({ key }).catch((err) => {
        logger.error({ err, key }, 'Failed to release idempotency reservation after error');
      });
    }

    return originalJson(body);
  };
}

/**
 * Idempotency middleware using a reserve-then-execute pattern.
 *
 * The previous implementation did findOne() then create() after the handler ran,
 * which is a check-then-act race: two concurrent requests with the same key both
 * saw "no existing key" and both executed (double order, double stock decrement).
 *
 * Here we INSERT a reservation first (see reserveKey). The unique index on `key`
 * guarantees exactly one request wins; concurrent duplicates are either replayed
 * (if the original already completed) or rejected with 409 (if still in flight).
 */
async function idempotencyMiddleware(req, res, next) {
  const key = req.get('idempotency-key');

  if (!key) {
    return next();
  }

  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(key)) {
    return res.status(400).json({ error: true, message: 'Invalid Idempotency-Key format' });
  }

  const result = await reserveKey(key);

  if (result.outcome === 'error') {
    return next(result.err);
  }

  if (result.outcome === 'replay') {
    logger.info({ key, requestId: req.id }, 'Idempotency key hit — replaying stored response');
    return res.status(result.statusCode).json(result.response);
  }

  if (result.outcome === 'in_progress') {
    logger.info({ key, requestId: req.id }, 'Idempotency key in progress — rejecting duplicate');
    return res.status(409).json(IN_PROGRESS_BODY);
  }

  // result.outcome === 'reserved' — we own the key.
  persistResponseOnFinish(res, key);
  next();
}

module.exports = idempotencyMiddleware;
