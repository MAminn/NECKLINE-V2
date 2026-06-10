const { Router } = require('express');
const authService = require('../../services/authService');
const cartService = require('../../services/cartService');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require('../../validators/authSchemas');
const authenticate = require('../../middleware/authenticate');
const {
  rateLimitLogin,
  rateLimitRegister,
  rateLimitReset,
} = require('../../middleware/rateLimitAuth');

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
};

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('access_token', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  res.cookie('refresh_token', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

function clearAuthCookies(res) {
  res.clearCookie('access_token', COOKIE_OPTIONS);
  res.clearCookie('refresh_token', COOKIE_OPTIONS);
}

function getMeta(req) {
  return {
    requestId: req.id,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };
}

// POST /api/v1/auth/register
router.post('/register', rateLimitRegister, async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join('; ');
      return res.status(400).json({ error: true, message });
    }

    const result = await authService.register(parsed.data, getMeta(req));

    // Merge guest cart if present
    const guestCartId = req.cookies?.cartId;
    if (guestCartId) {
      await cartService.mergeGuestCart(guestCartId, result.user.id);
      res.clearCookie('cartId', COOKIE_OPTIONS);
    }

    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(201).json({ success: true, data: { user: result.user } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/login
router.post('/login', rateLimitLogin, async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join('; ');
      return res.status(400).json({ error: true, message });
    }

    const result = await authService.login(parsed.data, getMeta(req));

    // Merge guest cart if present
    const guestCartId = req.cookies?.cartId;
    if (guestCartId) {
      await cartService.mergeGuestCart(guestCartId, result.user.id);
      res.clearCookie('cartId', COOKIE_OPTIONS);
    }

    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(200).json({ success: true, data: { user: result.user } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    await authService.logout(refreshToken, getMeta(req));
    clearAuthCookies(res);
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ error: true, message: 'Authentication required' });
    }

    const result = await authService.refresh(refreshToken, getMeta(req));
    setAuthCookies(res, result.accessToken, result.refreshToken);
    res.status(200).json({ success: true, data: { user: result.user } });
  } catch (err) {
    clearAuthCookies(res);
    next(err);
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/auth/me
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join('; ');
      return res.status(400).json({ error: true, message });
    }

    const user = await authService.updateProfile(req.user.id, parsed.data);
    res.status(200).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/auth/password
router.patch('/password', authenticate, async (req, res, next) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join('; ');
      return res.status(400).json({ error: true, message });
    }

    const { currentPassword, newPassword } = parsed.data;
    await authService.updateProfile(req.user.id, { currentPassword, newPassword });
    res.status(200).json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    if (err.statusCode === 401 || err.message?.includes('incorrect')) {
      return res.status(400).json({ error: true, message: 'Current password is incorrect' });
    }
    next(err);
  }
});

// POST /api/v1/auth/forgot-password
router.post('/forgot-password', rateLimitReset, async (req, res, next) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join('; ');
      return res.status(400).json({ error: true, message });
    }

    await authService.requestPasswordReset(parsed.data.email);
    res.status(200).json({
      success: true,
      message: 'If an account exists, a reset link has been sent.',
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/reset-password
router.post('/reset-password', rateLimitReset, async (req, res, next) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join('; ');
      return res.status(400).json({ error: true, message });
    }

    await authService.resetPassword(parsed.data.token, parsed.data.newPassword);
    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (err) {
    next(err);
  }
});


module.exports = router;
