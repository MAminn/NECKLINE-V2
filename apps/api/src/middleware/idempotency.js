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
 * Try to insert the reservation. Returns an outcome for the two terminal cases
 * (we won the insert, or the DB failed for a non-duplicate reason) and null on a
 * duplicate-key collision, which the caller resolves by looking up the holder.
 */
async function tryInsertReservation(key) {
  try {
    await IdempotencyKey.create({ key, status: 'in_progress' });
    return { outcome: 'reserved' };
  } catch (err) {
    return err?.code === 11000 ? null : { outcome: 'error', err };
  }
}

/**
 * After a duplicate-key collision, classify the record that beat us. Returns null
 * when it vanished between our failed insert and this lookup (the original request
 * released it after a non-2xx) — the slot is free again and the caller may retry.
 */
async function classifyExistingKey(key) {
  let existing;
  try {
    existing = await IdempotencyKey.findOne({ key: { $eq: key } }).lean();
  } catch (err) {
    return { outcome: 'error', err };
  }

  if (!existing) {
    return null;
  }

  return existing.status === 'completed'
    ? { outcome: 'replay', statusCode: existing.statusCode || 200, response: existing.response }
    : { outcome: 'in_progress' };
}

/**
 * Atomically reserve the key using a unique-index insert. Only one concurrent inserter
 * can win. If the reservation vanishes between our failed insert and the lookup, the
 * slot is free again — re-attempt a few times before giving up so a transient release
 * doesn't turn into a spurious 409.
 *
 * Returns a tagged outcome the middleware dispatches on:
 *   { outcome: 'reserved' }                          — we own the key, run the handler
 *   { outcome: 'replay', statusCode, response }      — original completed, replay it
 *   { outcome: 'in_progress' }                       — original still in flight, reject 409
 *   { outcome: 'error', err }                        — non-duplicate DB error, pass to next()
 */
async function reserveKey(key) {
  for (let attempt = 1; attempt <= MAX_RESERVE_ATTEMPTS; attempt += 1) {
    const inserted = await tryInsertReservation(key);
    if (inserted) {
      return inserted;
    }

    const existing = await classifyExistingKey(key);
    if (existing) {
      return existing;
    }

    // The reservation was released between our insert and lookup. Back off, retry.
    if (attempt < MAX_RESERVE_ATTEMPTS) {
      await sleep(RESERVE_RETRY_DELAY_MS);
    }
  }

  // Reservation stayed contended across every attempt — treat as in-flight.
  return { outcome: 'in_progress' };
}

/**
 * Release the reservation so a retry with the same key is not stuck behind a 409.
 * Failure here is logged but not rethrown — the partial in_progress TTL index on
 * IdempotencyKey is the backstop that eventually frees the slot.
 */
async function releaseReservation(key, context) {
  try {
    await IdempotencyKey.deleteOne({ key: { $eq: key } });
  } catch (err) {
    logger.error({ err, key }, `Failed to release idempotency reservation ${context}`);
  }
}

/**
 * Settle the reservation BEFORE the response bytes leave the process:
 *   2xx     → mark completed with the stored body (replays serve this)
 *   non-2xx → release the reservation so the client can retry a genuine failure
 *
 * If persisting the completed response fails, the reservation is released instead,
 * so retries re-execute the handler rather than 409-ing until the in_progress TTL.
 * The response is always sent afterwards — the handler's side effects are already
 * committed, so withholding the 2xx would only desync the client further.
 */
function persistResponseOnFinish(res, key) {
  const originalJson = res.json.bind(res);

  res.json = function patchedJson(body) {
    const statusCode = res.statusCode;

    const settle = async () => {
      if (statusCode >= 200 && statusCode < 300) {
        try {
          await IdempotencyKey.findOneAndUpdate(
            { key: { $eq: key } },
            { status: 'completed', statusCode, response: body }
          );
        } catch (err) {
          logger.error({ err, key }, 'Failed to persist idempotency response');
          await releaseReservation(key, 'after persist failure');
        }
      } else {
        await releaseReservation(key, 'after error response');
      }
    };

    settle().finally(() => originalJson(body));

    return res;
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
  const rawKey = req.get('idempotency-key');

  if (!rawKey) {
    return next();
  }

  if (typeof rawKey !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(rawKey)) {
    return res.status(400).json({ error: true, message: 'Invalid Idempotency-Key format' });
  }

  // Scope the key to the requester (authenticated user, or the anonymous
  // cartId cookie, falling back to IP) so a guessed/reused Idempotency-Key
  // from another client can never replay that client's stored response.
  const scope = req.user?.id || req.cookies?.cartId || req.ip;
  const key = `${scope}:${rawKey}`;

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
