const rateLimit = require('express-rate-limit');

const rateLimitCheckout = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: { error: true, message: 'Too many checkout attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false }, // IPv6 workaround
});

const rateLimitOrderCreate = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: { error: true, message: 'Too many order creation attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false }, // IPv6 workaround
});

module.exports = { rateLimitCheckout, rateLimitOrderCreate };
