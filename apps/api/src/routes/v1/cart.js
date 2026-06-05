const { Router } = require('express');
const cartService = require('../../services/cartService');
const idempotencyMiddleware = require('../../middleware/idempotency');
const rateLimitCart = require('../../middleware/rateLimitCart');
const rateLimitPromo = require('../../middleware/rateLimitPromo');
const maybeAuthenticate = require('../../middleware/maybeAuthenticate');
const validate = require('../../middleware/validate');
const { applyPromoSchema } = require('../../validators/promoCodeSchemas');

const router = Router();

router.use(maybeAuthenticate);

function getCartId(req) {
  return req.cookies?.cartId || null;
}

function setCartCookie(res, cartId) {
  res.cookie('cartId', cartId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
}

// GET /api/v1/cart
router.get('/', async (req, res, next) => {
  try {
    if (req.user?.id) {
      const cart = await cartService.getCart(null, req.user.id);
      if (cart) return res.json(cart);
    }
    const cartId = getCartId(req);
    if (!cartId) {
      return res.json({ cartId: null, items: [], itemCount: 0, subtotal: null, discount: null, shipping: null, total: null, appliedPromoCode: null });
    }
    const cart = await cartService.getCart(cartId);
    if (!cart) {
      res.clearCookie('cartId');
      return res.json({ cartId: null, items: [], itemCount: 0, subtotal: null, discount: null, shipping: null, total: null, appliedPromoCode: null });
    }
    res.json(cart);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/cart/items
router.post(
  '/items',
  rateLimitCart,
  idempotencyMiddleware,
  async (req, res, next) => {
    try {
      const { productId, quantity = 1 } = req.body;
      const userId = req.user?.id || null;
      const cartId = getCartId(req);

      const result = await cartService.addItem(cartId || null, productId, Number(quantity), {
        requestId: req.id,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId,
      });
      if (!userId) setCartCookie(res, result.cartId);

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/cart/items/:productId
router.patch('/items/:productId', rateLimitCart, async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const userId = req.user?.id || null;
    const cartId = getCartId(req);

    if (!cartId && !userId) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const result = await cartService.updateItem(cartId || null, req.params.productId, Number(quantity), {
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/cart/items/:productId
router.delete('/items/:productId', rateLimitCart, async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const cartId = getCartId(req);

    if (!cartId && !userId) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const result = await cartService.removeItem(cartId || null, req.params.productId, {
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/cart
router.delete('/', rateLimitCart, async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const cartId = getCartId(req);

    if (!cartId && !userId) {
      return res.json({ cartId: null, items: [], itemCount: 0, subtotal: null, discount: null, shipping: null, total: null, appliedPromoCode: null });
    }

    const result = await cartService.clearCart(cartId || null, {
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId,
    });
    res.clearCookie('cartId');
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/cart/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const cartId = getCartId(req);

    if (!cartId && !userId) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const result = await cartService.refreshCart(cartId || null, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/cart/apply-promo
router.post(
  '/apply-promo',
  rateLimitPromo,
  validate(applyPromoSchema),
  async (req, res, next) => {
    try {
      const { code } = req.body;
      const userId = req.user?.id || null;
      const cartId = getCartId(req);

      const result = await cartService.applyPromoCode(cartId || null, userId, code);
      if (result.cartId) {
        setCartCookie(res, result.cartId);
      }
      res.json(result);
    } catch (err) {
      if (err.name === 'DiscountError' || err.code?.startsWith('PROMO_')) {
        return res.status(400).json({ error: true, code: err.code, message: err.message });
      }
      next(err);
    }
  }
);

// DELETE /api/v1/cart/promo
router.delete('/promo', async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const cartId = getCartId(req);

    const result = await cartService.removePromoCode(cartId || null, userId);
    if (result.cartId) {
      setCartCookie(res, result.cartId);
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
