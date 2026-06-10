const { Router } = require('express');
const Order = require('../../../models/Order');
const authenticate = require('../../../middleware/authenticate');
const requirePermission = require('../../../middleware/requirePermission');
const { rateLimiterAdmin } = require('../../../middleware/rateLimitAdmin');
const { updateOrderSchema } = require('../../../validators/adminSchemas');
const { createAuditEvent } = require('../../../domain/audit');
const logger = require('../../../config/logger');
const escapeRegex = require('../../../utils/escapeRegex');

const router = Router();

// Mirror the Order schema enums (models/Order.js).
const ORDER_STATUSES = ['pending', 'pending_payment', 'confirmed', 'cancelled'];
const FULFILLMENT_STATUSES = ['unfulfilled', 'processing', 'shipped', 'delivered'];

router.use(authenticate, requirePermission('admin:access'), rateLimiterAdmin);

function formatOrder(o) {
  const itemsSummary = (o.lineItems || [])
    .map((li) => `${li.title} × ${li.quantity}`)
    .join(', ');
  return {
    id: o._id.toString(),
    orderNumber: o.orderNumber,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    itemsSummary,
    itemCount: (o.lineItems || []).reduce((s, li) => s + li.quantity, 0),
    total: o.total,
    currency: o.currency,
    status: o.status,
    fulfillmentStatus: o.fulfillmentStatus || 'unfulfilled',
    trackingNumber: o.trackingNumber || null,
    createdAt: o.createdAt,
    shippingAddress: o.shippingAddress
      ? { city: o.shippingAddress.city, governorate: o.shippingAddress.governorate }
      : {},
  };
}

// GET /api/v1/admin/orders
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (typeof req.query.search === 'string' && req.query.search) {
      const search = escapeRegex(req.query.search);
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
      ];
    }
    if (FULFILLMENT_STATUSES.includes(req.query.fulfillmentStatus)) {
      filter.fulfillmentStatus = { $eq: req.query.fulfillmentStatus };
    }
    if (ORDER_STATUSES.includes(req.query.status)) {
      filter.status = { $eq: req.query.status };
    }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      orders: orders.map(formatOrder),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/admin/orders/:id
router.put('/:id', async (req, res, next) => {
  try {
    const parsed = updateOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.errors.map((e) => e.message).join('; ');
      return res.status(400).json({ error: true, message });
    }
    const before = await Order.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ error: true, message: 'Order not found' });
    const order = await Order.findByIdAndUpdate(req.params.id, parsed.data, { new: true });
    createAuditEvent({
      actor: req.user.id,
      action: 'order.updated',
      target: order._id.toString(),
      targetType: 'Order',
      before: { fulfillmentStatus: before.fulfillmentStatus, trackingNumber: before.trackingNumber },
      after: parsed.data,
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
    res.json(formatOrder(order));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/orders/:id — hard delete
router.delete('/:id', async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ error: true, message: 'Order not found' });
    createAuditEvent({
      actor: req.user.id,
      action: 'order.deleted',
      target: order._id.toString(),
      targetType: 'Order',
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
