const rateLimit = require('express-rate-limit');

const rateLimitLogin = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },
  skipSuccessfulRequests: false,
  keyGenerator(req) {
    return req.ip;
  },
  handler(req, res) {
    res.status(429).json({
      error: true,
      message: 'Too many login attempts. Please try again later.',
    });
  },
});

const rateLimitRegister = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },
  keyGenerator(req) {
    return req.ip;
  },
  handler(req, res) {
    res.status(429).json({
      error: true,
      message: 'Too many registration attempts. Please try again later.',
    });
  },
});

const rateLimitReset = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },
  keyGenerator(req) {
    return req.ip;
  },
  handler(req, res) {
    res.status(429).json({
      error: true,
      message: 'Too many password reset attempts. Please try again later.',
    });
  },
});

module.exports = {
  rateLimitLogin,
  rateLimitRegister,
  rateLimitReset,
};
