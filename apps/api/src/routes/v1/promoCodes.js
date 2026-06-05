const { Router } = require('express');
const discountService = require('../../services/discountService');
const rateLimitPromo = require('../../middleware/rateLimitPromo');

const router = Router();

// GET /api/v1/promo-codes/:code/validate
router.get('/:code/validate', rateLimitPromo, async (req, res, next) => {
  try {
    const { code } = req.params;
    const subtotal = req.query.subtotal ? parseInt(req.query.subtotal, 10) : 0;
    const currency = req.query.currency || 'EGP';

    try {
      const promo = await discountService.validatePromoCode(code, subtotal, currency);
      res.json({
        valid: true,
        code: promo.code,
        type: promo.type,
        value: promo.value,
        description: promo.description || null,
      });
    } catch (err) {
      res.json({
        valid: false,
        code: code.toUpperCase().trim(),
        error: err.code || 'PROMO_INVALID',
        message: err.message,
      });
    }
  } catch (err) {
    next(err);
  }
});

module.exports = router;
