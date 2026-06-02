const { Router } = require('express');
const { createOrderSchema, orderLookupSchema } = require('../../validators/checkoutSchemas');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const maybeAuthenticate = require('../../middleware/maybeAuthenticate');
const requireCheckoutEnabled = require('../../middleware/requireCheckoutEnabled');
const { rateLimitOrderCreate } = require('../../middleware/rateLimitCheckout');
const idempotencyMiddleware = require('../../middleware/idempotency');
const checkoutService = require('../../services/checkoutService');
const orderService = require('../../services/orderService');
const { CheckoutError } = require('../../services/checkoutService');

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
      const userId = req.user?.id || null;
      const idempotencyKey = req.get('idempotency-key') || null;

      const order = await checkoutService.processOrder({
        checkoutToken,
        paymentMethod,
        idempotencyKey,
        meta: {
          requestId: req.id,
          ip: req.ip,
          userAgent: req.get('user-agent'),
        },
      });

      res.status(201).json({ order });
    } catch (err) {
      if (err instanceof CheckoutError) {
        const status = err.statusCode || 400;
        const body = { error: true, message: err.message, code: err.code };
        if (err.code === 'PAYMENT_FAILED') {
          body.checkoutToken = req.body.checkoutToken;
        }
        return res.status(status).json(body);
      }
      next(err);
    }
  }
);

// GET /api/v1/orders/:orderNumber
router.get(
  '/:orderNumber',
  validate(orderLookupSchema),
  async (req, res, next) => {
    try {
      const { orderNumber } = req.params;
      const { email } = req.query;

      const order = await orderService.getOrderByNumber(orderNumber);

      if (!order) {
        return res.status(404).json({ error: true, message: 'Order not found' });
      }

      // For guest orders, verify email matches
      if (!order.userId && email) {
        if (order.customerEmail.toLowerCase() !== email.toLowerCase()) {
          return res.status(404).json({ error: true, message: 'Order not found' });
        }
      }

      // For authenticated orders, user can view their own
      if (order.userId && req.user?.id) {
        if (order.userId.toString() !== req.user.id) {
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
