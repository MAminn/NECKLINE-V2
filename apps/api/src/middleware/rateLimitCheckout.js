const createRateLimiter = require('./createRateLimiter');

const rateLimitCheckout = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many checkout attempts. Please try again later.',
});

const rateLimitOrderCreate = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many order creation attempts. Please try again later.',
});

module.exports = { rateLimitCheckout, rateLimitOrderCreate };
