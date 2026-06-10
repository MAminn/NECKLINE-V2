const { Router } = require('express');
const { createOrderSchema, orderLookupSchema } = require('../../validators/checkoutSchemas');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const maybeAuthenticate = require('../../middleware/maybeAuthenticate');
const requireCheckoutEnabled = require('../../middleware/requireCheckoutEnabled');
const { rateLimitOrderCreate } = require('../../middleware/rateLimitCheckout');
const { rateLimitOrderLookup } = require('../../middleware/rateLimitOrderLookup');
const idempotencyMiddleware = require('../../middleware/idempotency');
const checkoutService = require('../../services/checkoutService');
const orderService = require('../../services/orderService');
const { CheckoutError } = require('../../services/checkoutService');
const { timingSafeStringEqual } = require('../../utils/timingSafeStringEqual');

const router = Router();

// POST /api/v1/orders
router.post(
  '/',
  requireCheckoutEnabled,
  rateLimitOrderCreate,
  maybeAuthenticate,
  idempotencyMiddleware,
  validate(createOrderSchema),
  async (req, res, next) => {
    try {
      const { checkoutToken, paymentMethod } = req.body;
      const idempotencyKey = req.get('idempotency-key') || null;

      const result = await checkoutService.processOrder({
        checkoutToken,
        paymentMethod,
        idempotencyKey,
        meta: {
          requestId: req.id,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      // Paymob returns { order, payUrl }; stub returns order directly
      if (result && result.payUrl) {
        res.status(201).json({ order: result.order, payUrl: result.payUrl });
      } else {
        res.status(201).json({ order: result });
      }
    } catch (err) {
      // PAYMENT_FAILED is special: return the checkoutToken so the client can retry the
      // same session. Every other CheckoutError is rendered by the central errorHandler.
      if (err instanceof CheckoutError && err.code === 'PAYMENT_FAILED') {
        return res.status(err.statusCode || 402).json({
          error: true,
          message: err.message,
          code: err.code,
          checkoutToken: req.body.checkoutToken,
        });
      }
      next(err);
    }
  }
);

// GET /api/v1/orders/:orderNumber
router.get(
  '/:orderNumber',
  rateLimitOrderLookup,
  validate(orderLookupSchema),
  maybeAuthenticate,
  async (req, res, next) => {
    try {
      const { orderNumber } = req.params;
      const { email } = req.query;

      const order = await orderService.getOrderByNumber(orderNumber);

      if (!order) {
        return res.status(404).json({ error: true, message: 'Order not found' });
      }

      if (order.userId) {
        // Authenticated order: caller must be logged in and own it
        if (!req.user?.id || order.userId.toString() !== req.user.id) {
          return res.status(404).json({ error: true, message: 'Order not found' });
        }
      } else {
        // Guest order: email is required and must match
        const customerEmail =
          typeof order.customerEmail === 'string' ? order.customerEmail : '';
        if (!email || !customerEmail || !timingSafeStringEqual(customerEmail.toLowerCase(), email.toLowerCase())) {
          return res.status(404).json({ error: true, message: 'Order not found' });
        }
      }

      res.json({ order });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/orders (authenticated order history)
router.get(
  '/',
  authenticate,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

      const result = await orderService.listOrdersByUser(req.user.id, { page, limit });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
