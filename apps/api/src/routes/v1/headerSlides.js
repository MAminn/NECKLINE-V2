const { Router } = require('express');
const HeaderSlide = require('../../models/HeaderSlide');
const authenticate = require('../../middleware/authenticate');
const requirePermission = require('../../middleware/requirePermission');
const { rateLimiterAdmin } = require('../../middleware/rateLimitAdmin');
const { validateBody } = require('../../middleware/validate');
const { headerSlideSchema } = require('../../validators/contentSchemas');
const { createAuditEvent } = require('../../domain/audit');
const logger = require('../../config/logger');

const router = Router();

// GET /api/v1/header-slides — public
router.get('/', async (req, res, next) => {
  try {
    const slides = await HeaderSlide.find({ active: true })
      .sort({ order: 1 })
      .lean();
    res.json(slides.map(formatSlide));
  } catch (err) {
    next(err);
  }
});

// Admin write sub-router (all mounted under /admin/header-slides in index.js)
const adminRouter = Router();
adminRouter.use(authenticate, requirePermission('admin:access'), rateLimiterAdmin);

// POST /api/v1/admin/header-slides
adminRouter.post('/', validateBody(headerSlideSchema), async (req, res, next) => {
  try {
    const doc = await HeaderSlide.create(req.body);
    createAuditEvent({
      actor: req.user.id,
      action: 'headerSlide.created',
      target: doc._id.toString(),
      targetType: 'HeaderSlide',
      after: { title: doc.title },
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
    res.status(201).json(formatSlide(doc));
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/admin/header-slides/:id
adminRouter.put('/:id', validateBody(headerSlideSchema.partial()), async (req, res, next) => {
  try {
    const doc = await HeaderSlide.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: true, message: 'Slide not found' });
    createAuditEvent({
      actor: req.user.id,
      action: 'headerSlide.updated',
      target: doc._id.toString(),
      targetType: 'HeaderSlide',
      after: req.body,
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
    res.json(formatSlide(doc));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/header-slides/:id
adminRouter.delete('/:id', async (req, res, next) => {
  try {
    const doc = await HeaderSlide.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ error: true, message: 'Slide not found' });
    createAuditEvent({
      actor: req.user.id,
      action: 'headerSlide.deleted',
      target: doc._id.toString(),
      targetType: 'HeaderSlide',
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

function formatSlide(s) {
  return {
    id: s._id.toString(),
    image: s.image,
    title: s.title,
    subtitle: s.subtitle,
    description: s.description,
    buttonText: s.buttonText,
    linkTo: s.linkTo,
    order: s.order,
    active: s.active,
  };
}

module.exports = { publicRouter: router, adminRouter };
