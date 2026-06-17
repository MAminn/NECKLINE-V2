const { Router } = require('express');
const Order = require('../../../models/Order');
const authenticate = require('../../../middleware/authenticate');
const requirePermission = require('../../../middleware/requirePermission');
const { rateLimiterAdmin } = require('../../../middleware/rateLimitAdmin');
const { validateBody } = require('../../../middleware/validate');
const { updateOrderSchema } = require('../../../validators/adminSchemas');
const { emitAudit } = require('../../../domain/audit');
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
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
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
    // Build the filter from the allowlist constants, never from req.query values.
    const fulfillmentIdx = FULFILLMENT_STATUSES.indexOf(req.query.fulfillmentStatus);
    if (fulfillmentIdx !== -1) {
      filter.fulfillmentStatus = { $eq: FULFILLMENT_STATUSES[fulfillmentIdx] };
    }
    const statusIdx = ORDER_STATUSES.indexOf(req.query.status);
    if (statusIdx !== -1) {
      filter.status = { $eq: ORDER_STATUSES[statusIdx] };
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
router.put('/:id', validateBody(updateOrderSchema), async (req, res, next) => {
  try {
    const before = await Order.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ error: true, message: 'Order not found' });
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    emitAudit(req, {
      action: 'order.updated',
      target: order._id.toString(),
      targetType: 'Order',
      before: { fulfillmentStatus: before.fulfillmentStatus, trackingNumber: before.trackingNumber },
      after: req.body,
    });
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
    emitAudit(req, {
      action: 'order.deleted',
      target: order._id.toString(),
      targetType: 'Order',
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
