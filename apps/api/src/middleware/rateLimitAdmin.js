const rateLimit = require('express-rate-limit');

const rateLimiterAdmin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  keyGenerator(req) {
    return req.ip;
  },
  handler(req, res) {
    res.status(429).json({
      error: true,
      message: 'Too many requests. Please try again later.',
    });
  },
});

module.exports = { rateLimiterAdmin };
