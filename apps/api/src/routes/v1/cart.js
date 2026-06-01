const { Router } = require('express');
const cartService = require('../../services/cartService');
const idempotencyMiddleware = require('../../middleware/idempotency');
const rateLimitCart = require('../../middleware/rateLimitCart');

const router = Router();

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
    const cartId = getCartId(req);
    if (!cartId) {
      return res.json({ cartId: null, items: [], itemCount: 0, subtotal: null });
    }
    const cart = await cartService.getCart(cartId);
    if (!cart) {
      res.clearCookie('cartId');
      return res.json({ cartId: null, items: [], itemCount: 0, subtotal: null });
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
      const cartId = getCartId(req);

      const result = await cartService.addItem(cartId, productId, Number(quantity), {
        requestId: req.id,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      });
      setCartCookie(res, result.cartId);

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
    const cartId = getCartId(req);
    if (!cartId) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const result = await cartService.updateItem(cartId, req.params.productId, Number(quantity), {
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/cart/items/:productId
router.delete('/items/:productId', rateLimitCart, async (req, res, next) => {
  try {
    const cartId = getCartId(req);
    if (!cartId) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const result = await cartService.removeItem(cartId, req.params.productId, {
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/cart
router.delete('/', rateLimitCart, async (req, res, next) => {
  try {
    const cartId = getCartId(req);
    if (!cartId) {
      return res.json({ cartId: null, items: [], itemCount: 0, subtotal: null });
    }

    const result = await cartService.clearCart(cartId, {
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
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
    const cartId = getCartId(req);
    if (!cartId) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const result = await cartService.refreshCart(cartId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
