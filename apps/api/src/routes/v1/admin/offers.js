const { Router } = require('express');
const PromoCode = require('../../../models/PromoCode');
const authenticate = require('../../../middleware/authenticate');
const requirePermission = require('../../../middleware/requirePermission');
const { rateLimiterAdmin } = require('../../../middleware/rateLimitAdmin');
const { createOfferSchema } = require('../../../validators/adminSchemas');
const { createAuditEvent } = require('../../../domain/audit');
const logger = require('../../../config/logger');

const router = Router();

router.use(authenticate, requirePermission('admin:access'), rateLimiterAdmin);

function formatOffer(p) {
  return {
    id: p._id.toString(),
    description: p.description,
    type: p.type,
    value: p.value,
    minOrderAmount: p.minOrderAmount,
    endDate: p.endDate,
    active: p.active,
    isAutomatic: p.isAutomatic,
    createdAt: p.createdAt,
  };
}

// GET /api/v1/admin/offers
router.get('/', async (req, res, next) => {
  try {
    const offers = await PromoCode.find({ isAutomatic: true }).sort({ createdAt: -1 }).lean();
    res.json({ offers: offers.map(formatOffer) });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/offers
router.post('/', async (req, res, next) => {
  try {
    const parsed = createOfferSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join('; ');
      return res.status(400).json({ error: true, message });
    }
    const data = { ...parsed.data, isAutomatic: true };
    if (data.endDate) data.endDate = new Date(data.endDate);
    const offer = await PromoCode.create(data);
    createAuditEvent({
      actor: req.user.id,
      action: 'offer.created',
      target: offer._id.toString(),
      targetType: 'PromoCode',
      after: { description: offer.description, type: offer.type, value: offer.value },
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
    res.status(201).json(formatOffer(offer));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/offers/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const offer = await PromoCode.findOneAndDelete({ _id: req.params.id, isAutomatic: true });
    if (!offer) return res.status(404).json({ error: true, message: 'Offer not found' });
    createAuditEvent({
      actor: req.user.id,
      action: 'offer.deleted',
      target: offer._id.toString(),
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
