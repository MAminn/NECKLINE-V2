const { Router } = require('express');
const { checkoutSchema } = require('../../validators/checkoutSchemas');
const validate = require('../../middleware/validate');
const maybeAuthenticate = require('../../middleware/maybeAuthenticate');
const requireCheckoutEnabled = require('../../middleware/requireCheckoutEnabled');
const { rateLimitCheckout } = require('../../middleware/rateLimitCheckout');
const shippingService = require('../../services/shippingService');
const checkoutService = require('../../services/checkoutService');

const router = Router();

// GET /api/v1/checkout/shipping-methods
router.get('/shipping-methods', async (req, res, next) => {
  try {
    const methods = await shippingService.getActiveShippingMethods();
    res.json({ methods });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/checkout
router.post(
  '/',
  requireCheckoutEnabled,
  rateLimitCheckout,
  maybeAuthenticate,
  validate(checkoutSchema),
  async (req, res, next) => {
    try {
      const { cartId, contact, shippingAddress } = req.body;
      const userId = req.user?.id || null;

      const result = await checkoutService.createCheckoutSession({
        cartId: cartId || null,
        userId,
        contact,
        shippingAddress,
      });

      res.json(result);
    } catch (err) {
      if (err.code === 'EMPTY_CART') {
        return res.status(400).json({ error: true, message: err.message, code: err.code });
      }
      if (err.code === 'STOCK_UNAVAILABLE') {
        return res.status(409).json({ error: true, message: err.message, code: err.code });
      }
      next(err);
    }
  }
);

module.exports = router;
