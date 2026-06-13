const createRateLimiter = require('./createRateLimiter');

const { ipKeyGenerator } = createRateLimiter;

const rateLimitCart = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 50,
  message: 'Too many cart operations. Please try again later.',
  keyGenerator: (req) => req.cookies?.cartId || ipKeyGenerator(req.ip),
});

module.exports = rateLimitCart;
