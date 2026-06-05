const rateLimit = require('express-rate-limit');

const rateLimitPromo = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: true,
      code: 'RATE_LIMITED',
      message: 'Too many promo code attempts. Please try again later.',
    });
  },
});

module.exports = rateLimitPromo;
