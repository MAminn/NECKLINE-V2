const createRateLimiter = require('./createRateLimiter');

const rateLimitPromo = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  code: 'RATE_LIMITED',
  message: 'Too many promo code attempts. Please try again later.',
});

module.exports = rateLimitPromo;
