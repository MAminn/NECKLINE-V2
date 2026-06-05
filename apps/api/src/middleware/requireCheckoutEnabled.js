const env = require('../config/env');

function requireCheckoutEnabled(req, res, next) {
  if (!env.CHECKOUT_ENABLED) {
    return res.status(503).json({
      error: true,
      message: 'Checkout is temporarily unavailable',
    });
  }
  next();
}

module.exports = requireCheckoutEnabled;
