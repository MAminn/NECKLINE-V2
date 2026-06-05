const IdempotencyKey = require('../models/IdempotencyKey');
const logger = require('../config/logger');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_RESERVE_ATTEMPTS = 3;
const RESERVE_RETRY_DELAY_MS = 50;

/**
 * Idempotency middleware using a reserve-then-execute pattern.
 *
 * The previous implementation did findOne() then create() after the handler ran,
 * which is a check-then-act race: two concurrent requests with the same key both
 * saw "no existing key" and both executed (double order, double stock decrement).
 *
 * Here we INSERT a reservation first. The unique index on `key` guarantees exactly
 * one request wins the insert; concurrent duplicates get a duplicate-key error and
 * are either replayed (if the original already completed) or rejected with 409
 * (if the original is still in flight). The reservation is filled with the response
 * on a 2xx, or released on a non-2xx so the client can retry a genuine failure.
 */
async function idempotencyMiddleware(req, res, next) {
  const key = req.get('idempotency-key');

  if (!key) {
    return next();
  }

  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(key)) {
    return res.status(400).json({ error: true, message: 'Invalid Idempotency-Key format' });
  }

  // Atomically reserve the key. Only one concurrent inserter can win. If the reservation
  // vanishes between our failed insert and the lookup (the original request released it
  // after a non-2xx), the slot is free again — re-attempt a few times before giving up so a
  // transient release doesn't turn into a spurious 409.
  let reserved = false;

  for (let attempt = 1; attempt <= MAX_RESERVE_ATTEMPTS && !reserved; attempt += 1) {
    try {
      await IdempotencyKey.create({ key, status: 'in_progress' });
      reserved = true;
    } catch (err) {
      if (!err || err.code !== 11000) {
        return next(err);
      }

      const existing = await IdempotencyKey.findOne({ key }).lean();

      if (existing && existing.status === 'completed') {
        logger.info({ key, requestId: req.id }, 'Idempotency key hit — replaying stored response');
        return res.status(existing.statusCode || 200).json(existing.response);
      }

      if (existing) {
        // Original request is still being processed — do not execute a second time.
        logger.info({ key, requestId: req.id }, 'Idempotency key in progress — rejecting duplicate');
        return res.status(409).json({
          error: true,
          message: 'A request with this Idempotency-Key is already being processed',
          code: 'IDEMPOTENCY_IN_PROGRESS',
        });
      }

      // existing === null: the reservation was released between our insert and lookup.
      // Back off briefly, then retry the reservation.
      if (attempt < MAX_RESERVE_ATTEMPTS) {
        await sleep(RESERVE_RETRY_DELAY_MS);
      }
    }
  }

  if (!reserved) {
    logger.info({ key, requestId: req.id }, 'Idempotency key reservation contended — rejecting duplicate');
    return res.status(409).json({
      error: true,
      message: 'A request with this Idempotency-Key is already being processed',
      code: 'IDEMPOTENCY_IN_PROGRESS',
    });
  }

  // We own the reservation. Persist the response on success, release it on failure.
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
      // Release the reservation so a genuine failure can be retried.
      IdempotencyKey.deleteOne({ key }).catch((err) => {
        logger.error({ err, key }, 'Failed to release idempotency reservation after error');
      });
    }

    return originalJson(body);
  };

  next();
}

module.exports = idempotencyMiddleware;
