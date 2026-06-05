const { Router } = require('express');
const PromoCode = require('../../../models/PromoCode');
const validate = require('../../../middleware/validate');
const authenticate = require('../../../middleware/authenticate');
const requirePermission = require('../../../middleware/requirePermission');
const { rateLimiterAdmin } = require('../../../middleware/rateLimitAdmin');
const { createPromoCodeSchema, updatePromoCodeSchema } = require('../../../validators/promoCodeSchemas');
const { createAuditEvent } = require('../../../domain/audit');
const logger = require('../../../config/logger');

const router = Router();

router.use(authenticate, requirePermission('admin:access'), rateLimiterAdmin);

function serializePromo(p) {
  return {
    id: p._id.toString(),
    code: p.code,
    type: p.type,
    value: p.value,
    minOrderAmount: p.minOrderAmount,
    maxDiscountAmount: p.maxDiscountAmount,
    usageLimit: p.usageLimit,
    usageCount: p.usageCount,
    startDate: p.startDate,
    endDate: p.endDate,
    active: p.active,
    isAutomatic: p.isAutomatic,
    description: p.description,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// GET /api/v1/admin/promo-codes
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.active !== undefined) filter.active = req.query.active === 'true';
    if (req.query.type) filter.type = req.query.type;
    if (req.query.isAutomatic !== undefined) filter.isAutomatic = req.query.isAutomatic === 'true';

    const [promoCodes, total] = await Promise.all([
      PromoCode.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      PromoCode.countDocuments(filter),
    ]);

    res.json({
      promoCodes: promoCodes.map(serializePromo),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/promo-codes
router.post('/', validate(createPromoCodeSchema), async (req, res, next) => {
  try {
    const data = req.body;
    if (data.code) data.code = data.code.toUpperCase().trim();
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);

    const promoCode = await PromoCode.create(data);

    if (req.id) {
      createAuditEvent({
        actor: req.user.id,
        action: 'promoCode.created',
        target: promoCode._id.toString(),
        targetType: 'PromoCode',
        after: { code: promoCode.code, type: promoCode.type, value: promoCode.value },
        requestId: req.id,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      }).catch((err) => logger.error({ err }, 'Audit event failed'));
    }

    res.status(201).json(serializePromo(promoCode));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: true, message: 'Promo code already exists' });
    }
    next(err);
  }
});

// GET /api/v1/admin/promo-codes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id).lean();
    if (!promoCode) return res.status(404).json({ error: true, message: 'Promo code not found' });
    res.json(serializePromo(promoCode));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/admin/promo-codes/:id
router.patch('/:id', validate(updatePromoCodeSchema), async (req, res, next) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) return res.status(404).json({ error: true, message: 'Promo code not found' });

    const updates = { ...req.body };
    delete updates.usageCount;

    if (updates.code && updates.code !== promoCode.code && promoCode.usageCount > 0) {
      return res.status(409).json({ error: true, message: 'Cannot change code after it has been used' });
    }

    if (updates.code) updates.code = updates.code.toUpperCase().trim();
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    Object.assign(promoCode, updates);
    await promoCode.save();

    if (req.id) {
      createAuditEvent({
        actor: req.user.id,
        action: 'promoCode.updated',
        target: promoCode._id.toString(),
        targetType: 'PromoCode',
        after: { code: promoCode.code, active: promoCode.active },
        requestId: req.id,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      }).catch((err) => logger.error({ err }, 'Audit event failed'));
    }

    res.json(serializePromo(promoCode));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: true, message: 'Promo code already exists' });
    }
    next(err);
  }
});

// DELETE /api/v1/admin/promo-codes/:id (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) return res.status(404).json({ error: true, message: 'Promo code not found' });

    promoCode.active = false;
    await promoCode.save();

    if (req.id) {
      createAuditEvent({
        actor: req.user.id,
        action: 'promoCode.deactivated',
        target: promoCode._id.toString(),
        targetType: 'PromoCode',
        after: { code: promoCode.code, active: false },
        requestId: req.id,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      }).catch((err) => logger.error({ err }, 'Audit event failed'));
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
