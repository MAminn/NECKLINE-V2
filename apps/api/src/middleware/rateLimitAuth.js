const createRateLimiter = require('./createRateLimiter');

const rateLimitLogin = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts. Please try again later.',
});

const rateLimitRegister = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many registration attempts. Please try again later.',
});

const rateLimitReset = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts. Please try again later.',
});

module.exports = {
  rateLimitLogin,
  rateLimitRegister,
  rateLimitReset,
};
