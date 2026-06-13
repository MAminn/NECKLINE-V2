const { Router } = require('express');
const Product = require('../../../models/Product');
const authenticate = require('../../../middleware/authenticate');
const requirePermission = require('../../../middleware/requirePermission');
const { rateLimiterAdmin } = require('../../../middleware/rateLimitAdmin');
const { validateBody } = require('../../../middleware/validate');
const { createProductSchema, updateProductSchema } = require('../../../validators/adminSchemas');
const { createAuditEvent } = require('../../../domain/audit');
const logger = require('../../../config/logger');
const escapeRegex = require('../../../utils/escapeRegex');

const router = Router();

router.use(authenticate, requirePermission('admin:access'), rateLimiterAdmin);

function formatProduct(p) {
  const images = p.images || [];
  return {
    id: p._id.toString(),
    name: p.name,
    sku: p.sku,
    category: p.category || '',
    price: p.price,
    currency: p.currency,
    stockOnHand: p.stockOnHand,
    status: computeStatus(p),
    views: p.views || 0,
    sales: p.sales || 0,
    image: images[0] || '',
    galleryImages: images,
    subtitle: p.subtitle || '',
    purchasable: p.purchasable,
    deletedAt: p.deletedAt ?? null,
    createdAt: p.createdAt,
  };
}

function computeStatus(p) {
  if (!p.purchasable || p.stockOnHand === 0) return 'OUT OF STOCK';
  if (p.stockOnHand <= 5) return 'LOW STOCK';
  return 'ACTIVE';
}

// GET /api/v1/admin/products
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 8));
    const skip = (page - 1) * limit;

    const filter = {};
    if (typeof req.query.search === 'string' && req.query.search) {
      const search = escapeRegex(req.query.search);
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    if (typeof req.query.category === 'string' && req.query.category) {
      filter.category = { $eq: req.query.category };
    }
    if (req.query.status === 'OUT OF STOCK') {
      filter.$or = [{ stockOnHand: 0 }, { purchasable: false }];
    } else if (req.query.status === 'LOW STOCK') {
      filter.stockOnHand = { $gt: 0, $lte: 5 };
      filter.purchasable = true;
    } else if (req.query.status === 'ACTIVE') {
      filter.stockOnHand = { $gt: 5 };
      filter.purchasable = true;
      filter.deletedAt = null;
    }

    const [products, total, kpiAgg] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
      Product.aggregate([
        { $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $and: [{ $gt: ['$stockOnHand', 0] }, '$purchasable', { $eq: ['$deletedAt', null] }] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $or: [{ $eq: ['$stockOnHand', 0] }, { $eq: ['$purchasable', false] }] }, 1, 0] } },
          totalViews: { $sum: '$views' },
        } },
      ]),
    ]);

    const kpis = kpiAgg[0] ?? { total: 0, active: 0, outOfStock: 0, totalViews: 0 };

    res.json({
      products: products.map(formatProduct),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      kpis: {
        total: kpis.total,
        active: kpis.active,
        outOfStock: kpis.outOfStock,
        totalViews: kpis.totalViews,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/admin/products
router.post('/', validateBody(createProductSchema), async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    createAuditEvent({
      actor: req.user.id,
      action: 'product.created',
      target: product._id.toString(),
      targetType: 'Product',
      after: { name: product.name, sku: product.sku },
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
    res.status(201).json(formatProduct(product));
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: true, message: 'SKU already exists' });
    }
    next(err);
  }
});

// PUT /api/v1/admin/products/:id
router.put('/:id', validateBody(updateProductSchema), async (req, res, next) => {
  try {
    const before = await Product.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ error: true, message: 'Product not found' });
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    createAuditEvent({
      actor: req.user.id,
      action: 'product.updated',
      target: product._id.toString(),
      targetType: 'Product',
      before: { name: before.name, price: before.price, stockOnHand: before.stockOnHand },
      after: req.body,
      requestId: req.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
    res.json(formatProduct(product));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/admin/products/:id — soft delete
router.delete('/:id', async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: true, message: 'Product not found' });
    createAuditEvent({
      actor: req.user.id,
      action: 'product.deleted',
      target: product._id.toString(),
      targetType: 'Product',
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
