const rateLimit = require('express-rate-limit');

const rateLimitOrderLookup = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: { error: true, message: 'Too many order lookup attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false }, // IPv6 workaround
});

module.exports = { rateLimitOrderLookup };
