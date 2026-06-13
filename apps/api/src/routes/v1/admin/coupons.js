const { Router } = require('express');
const PromoCode = require('../../../models/PromoCode');
const authenticate = require('../../../middleware/authenticate');
const requirePermission = require('../../../middleware/requirePermission');
const { rateLimiterAdmin } = require('../../../middleware/rateLimitAdmin');
const { validateBody } = require('../../../middleware/validate');
const { createCouponSchema } = require('../../../validators/adminSchemas');
const { createAuditEvent } = require('../../../domain/audit');
const logger = require('../../../config/logger');

const router = Router();

router.use(authenticate, requirePermission('admin:access'), rateLimiterAdmin);

function formatPromoCode(p) {
  return {
    id: p._id.toString(),
    code: p.code,
    type: p.type,
    value: p.value,
    minOrderAmount: p.minOrderAmount,
    maxDiscountAmount: p.maxDiscountAmount,
    usageLimit: p.usageLimit,
    usageCount: p.usageCount,
    endDate: p.endDate,
    active: p.active,
    isAutomatic: p.isAutomatic,
    description: p.description,
    createdAt: p.createdAt,
  };
}

// GET /api/v1/admin/coupons
router.get('/', async (req, res, next) => {
  try {
    const coupons = await PromoCode.find({ isAutomatic: false }).sort({ createdAt: -1 }).lean();
    res.json({ coupons: coupons.map(formatPromoCode) });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/coupons
router.post('/', validateBody(createCouponSchema), async (req, res, next) => {
  try {
    const data = { ...req.body, isAutomatic: false };
    if (data.endDate) data.endDate = new Date(data.endDate);
    const coupon = await PromoCode.create(data);
    createAuditEvent({
      actor: req.user.id,
      action: 'coupon.created',
      target: coupon._id.toString(),
      targetType: 'PromoCode',
      after: { code: coupon.code, type: coupon.type, value: coupon.value },
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
    res.status(201).json(formatPromoCode(coupon));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: true, message: 'Coupon code already exists' });
    }
    next(err);
  }
});

// DELETE /api/v1/admin/coupons/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const coupon = await PromoCode.findOneAndDelete({ _id: req.params.id, isAutomatic: false });
    if (!coupon) return res.status(404).json({ error: true, message: 'Coupon not found' });
    createAuditEvent({
      actor: req.user.id,
      action: 'coupon.deleted',
      target: coupon._id.toString(),
      targetType: 'PromoCode',
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
