const createRateLimiter = require('./createRateLimiter');

const rateLimiterAdmin = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: 'Too many requests. Please try again later.',
});

module.exports = { rateLimiterAdmin };
