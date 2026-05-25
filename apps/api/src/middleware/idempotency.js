const IdempotencyKey = require('../models/IdempotencyKey');
const logger = require('../config/logger');

async function idempotencyMiddleware(req, res, next) {
  const key = req.get('idempotency-key');

  if (!key) {
    return next();
  }

  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(key)) {
    return res.status(400).json({ error: true, message: 'Invalid Idempotency-Key format' });
  }

  try {
    const existing = await IdempotencyKey.findOne({ key }).lean();

    if (existing) {
      logger.info({ key, requestId: req.id }, 'Idempotency key hit');
      return res.status(200).json(existing.response);
    }

    // Attach a helper to the response to store the key after successful handling
    res.locals.idempotencyKey = key;
    const originalJson = res.json.bind(res);

    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300 && res.locals.idempotencyKey) {
        IdempotencyKey.create({
          key: res.locals.idempotencyKey,
          response: body,
        }).catch((err) => {
          logger.error({ err, key: res.locals.idempotencyKey }, 'Failed to store idempotency key');
        });
      }
      return originalJson(body);
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = idempotencyMiddleware;
