const rateLimit = require('express-rate-limit');

const rateLimitCart = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },
  keyGenerator(req) {
    return req.cookies?.cartId || req.ip;
  },
  handler(req, res) {
    res.status(429).json({
      error: true,
      message: 'Too many cart operations. Please try again later.',
    });
  },
});

module.exports = rateLimitCart;
