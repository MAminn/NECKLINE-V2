const { Router } = require('express');
const Testimonial = require('../../models/Testimonial');
const authenticate = require('../../middleware/authenticate');
const requirePermission = require('../../middleware/requirePermission');
const { rateLimiterAdmin } = require('../../middleware/rateLimitAdmin');
const { testimonialSchema } = require('../../validators/contentSchemas');
const { createAuditEvent } = require('../../domain/audit');
const logger = require('../../config/logger');

const router = Router();

// GET /api/v1/testimonials — public
router.get('/', async (req, res, next) => {
  try {
    const testimonials = await Testimonial.find({ deletedAt: null })
      .sort({ createdAt: -1 })
      .lean();
    res.json(testimonials.map(formatTestimonial));
  } catch (err) {
    next(err);
  }
});

// Admin write sub-router
const adminRouter = Router();
adminRouter.use(authenticate, requirePermission('admin:access'), rateLimiterAdmin);

// POST /api/v1/testimonials
adminRouter.post('/', async (req, res, next) => {
  try {
    const parsed = testimonialSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join('; ');
      return res.status(400).json({ error: true, message });
    }
    const doc = await Testimonial.create(parsed.data);
    createAuditEvent({
      actor: req.user.id,
      action: 'testimonial.created',
      target: doc._id.toString(),
      targetType: 'Testimonial',
      after: { name: doc.name, product: doc.product },
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
    res.status(201).json(formatTestimonial(doc));
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/testimonials/:id
adminRouter.put('/:id', async (req, res, next) => {
  try {
    const parsed = testimonialSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join('; ');
      return res.status(400).json({ error: true, message });
    }
    const doc = await Testimonial.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
    if (!doc) return res.status(404).json({ error: true, message: 'Testimonial not found' });
    createAuditEvent({
      actor: req.user.id,
      action: 'testimonial.updated',
      target: doc._id.toString(),
      targetType: 'Testimonial',
      after: parsed.data,
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
    res.json(formatTestimonial(doc));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/testimonials/:id — soft delete
adminRouter.delete('/:id', async (req, res, next) => {
  try {
    const doc = await Testimonial.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: true, message: 'Testimonial not found' });
    createAuditEvent({
      actor: req.user.id,
      action: 'testimonial.deleted',
      target: doc._id.toString(),
      targetType: 'Testimonial',
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.use('/', adminRouter);

function formatTestimonial(t) {
  return {
    id: t._id.toString(),
    name: t.name,
    product: t.product,
    rating: t.rating,
    comment: t.comment,
    verified: t.verified,
    date: t.date,
    deletedAt: t.deletedAt ?? null,
    createdAt: t.createdAt,
  };
}

module.exports = router;
