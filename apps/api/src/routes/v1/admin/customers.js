const { Router } = require('express');
const User = require('../../../models/User');
const Order = require('../../../models/Order');
const authenticate = require('../../../middleware/authenticate');
const requirePermission = require('../../../middleware/requirePermission');
const { rateLimiterAdmin } = require('../../../middleware/rateLimitAdmin');
const { createAuditEvent } = require('../../../domain/audit');
const logger = require('../../../config/logger');
const escapeRegex = require('../../../utils/escapeRegex');

const router = Router();

router.use(authenticate, requirePermission('admin:access'), rateLimiterAdmin);

/**
 * Customer tier classification — server-authoritative.
 * The frontend renders the returned `tag` as-is; do not duplicate this logic in the UI.
 * Future segmenting (e.g. offer "Customer Segments") should reuse these rules.
 */
const VIP_ORDERS_THRESHOLD = 3;
const VIP_LIFETIME_VALUE_THRESHOLD = 5_000_000; // minor units (cents) — 50,000 EGP

function computeCustomerTag({ ordersCount, lifetimeValue }) {
  if (ordersCount >= VIP_ORDERS_THRESHOLD || lifetimeValue >= VIP_LIFETIME_VALUE_THRESHOLD) return 'VIP';
  if (ordersCount === 0) return 'NEW';
  return 'ACTIVE';
}

// GET /api/v1/admin/customers
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { role: 'customer' };
    if (typeof req.query.search === 'string' && req.query.search) {
      const search = escapeRegex(req.query.search);
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total, newThisWeek] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
      User.countDocuments({ role: 'customer', createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    ]);

    const userIds = users.map((u) => u._id);
    const orderAgg = await Order.aggregate([
      { $match: { userId: { $in: userIds }, status: 'confirmed' } },
      {
        $group: {
          _id: '$userId',
          ordersCount: { $sum: 1 },
          lifetimeValue: { $sum: '$total' },
          lastOrderAt: { $max: '$createdAt' },
        },
      },
    ]);

    const statsMap = {};
    for (const s of orderAgg) statsMap[s._id.toString()] = s;

    const customers = users.map((u) => {
      const stats = statsMap[u._id.toString()] ?? { ordersCount: 0, lifetimeValue: 0, lastOrderAt: null };
      return {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        ordersCount: stats.ordersCount,
        lifetimeValue: stats.lifetimeValue,
        currency: 'EGP',
        createdAt: u.createdAt,
        lastOrderAt: stats.lastOrderAt ?? null,
        tag: computeCustomerTag(stats),
      };
    });

    const returning = customers.filter((c) => c.ordersCount > 1).length;

    res.json({
      customers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      kpis: { total, newThisWeek, returning },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/customers/:email
router.delete('/:email', async (req, res, next) => {
  try {
    const user = await User.findOneAndDelete({ email: req.params.email.toLowerCase() });
    if (!user) return res.status(404).json({ error: true, message: 'Customer not found' });
    createAuditEvent({
      actor: req.user.id,
      action: 'customer.deleted',
      target: user._id.toString(),
      targetType: 'User',
      after: { email: user.email },
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
