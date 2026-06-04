const { Router } = require('express');
const authenticate = require('../../../middleware/authenticate');
const requirePermission = require('../../../middleware/requirePermission');
const { rateLimiterAdmin } = require('../../../middleware/rateLimitAdmin');
const adminMetricsService = require('../../../services/adminMetricsService');

const router = Router();

router.use(authenticate, requirePermission('admin:access'), rateLimiterAdmin);

// GET /api/v1/admin/metrics
router.get('/', async (req, res, next) => {
  try {
    const metrics = await adminMetricsService.getMetrics();
    res.json(metrics);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
