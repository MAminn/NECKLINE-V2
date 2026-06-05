const { Router } = require('express');
const AuditEvent = require('../../../models/AuditEvent');
const authenticate = require('../../../middleware/authenticate');
const requirePermission = require('../../../middleware/requirePermission');
const { rateLimiterAdmin } = require('../../../middleware/rateLimitAdmin');

const router = Router();

router.use(authenticate, requirePermission('admin:access'), rateLimiterAdmin);

// GET /api/v1/admin/activity-log
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      AuditEvent.find({}).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
      AuditEvent.countDocuments({}),
    ]);

    res.json({
      events: events.map((e) => ({
        id: e._id.toString(),
        actor: e.actor,
        action: e.action,
        target: e.target,
        targetType: e.targetType,
        before: e.before ?? null,
        after: e.after ?? null,
        timestamp: e.timestamp,
        requestId: e.requestId,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
