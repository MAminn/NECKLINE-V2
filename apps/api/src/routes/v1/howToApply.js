const { Router } = require('express');
const HowToApply = require('../../models/HowToApply');
const authenticate = require('../../middleware/authenticate');
const requirePermission = require('../../middleware/requirePermission');
const { rateLimiterAdmin } = require('../../middleware/rateLimitAdmin');
const { howToApplySchema } = require('../../validators/contentSchemas');
const { createAuditEvent } = require('../../domain/audit');
const logger = require('../../config/logger');

const router = Router();

// GET /api/v1/how-to-apply — public
router.get('/', async (req, res, next) => {
  try {
    const doc = await HowToApply.findOne({ configKey: 'default' }).lean();
    if (!doc) return res.json({ color: '#D21B27', steps: [] });
    res.json({ color: doc.color, steps: doc.steps });
  } catch (err) {
    next(err);
  }
});

// Admin write sub-router
const adminRouter = Router();
adminRouter.use(authenticate, requirePermission('admin:access'), rateLimiterAdmin);

// POST /api/v1/admin/how-to-apply — upsert
adminRouter.post('/', async (req, res, next) => {
  try {
    const parsed = howToApplySchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join('; ');
      return res.status(400).json({ error: true, message });
    }
    const doc = await HowToApply.findOneAndUpdate(
      { configKey: 'default' },
      { $set: { color: parsed.data.color, steps: parsed.data.steps } },
      { upsert: true, new: true }
    );
    createAuditEvent({
      actor: req.user.id,
      action: 'howToApply.updated',
      target: 'default',
      targetType: 'HowToApply',
      after: { color: parsed.data.color, stepCount: parsed.data.steps.length },
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
    res.json({ color: doc.color, steps: doc.steps });
  } catch (err) {
    next(err);
  }
});

module.exports = { publicRouter: router, adminRouter };
