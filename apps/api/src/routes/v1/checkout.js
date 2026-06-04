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
      const { cartId, contact, shippingAddress, promoCode } = req.body;
      const userId = req.user?.id || null;

      const result = await checkoutService.createCheckoutSession({
        cartId: cartId || null,
        userId,
        contact,
        shippingAddress,
        promoCode: promoCode || null,
      });

      res.json(result);
    } catch (err) {
      // CheckoutError carries statusCode + code; the central errorHandler renders them.
      next(err);
    }
  }
);

module.exports = router;
