const Product = require('../models/Product');

const SORT_MAP = {
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name_asc: { name: 1 },
  name_desc: { name: -1 },
  newest: { createdAt: -1 },
};

const DEFAULT_SORT = { createdAt: -1 };
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

function buildBaseFilter() {
  return { deletedAt: null, purchasable: true };
}

async function listProducts({ page = 1, limit = DEFAULT_LIMIT, category, tags, sort = 'newest', inStock }) {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT));
  const skip = (parsedPage - 1) * parsedLimit;

  const filter = buildBaseFilter();

  if (category) {
    filter.category = category;
  }

  if (tags) {
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagList.length > 0) {
      filter.tags = { $in: tagList };
    }
  }

  if (inStock === 'true' || inStock === true) {
    filter.stockOnHand = { $gt: 0 };
  }

  const sortOrder = SORT_MAP[sort] || DEFAULT_SORT;

  const [data, total] = await Promise.all([
    Product.find(filter).sort(sortOrder).skip(skip).limit(parsedLimit).lean(),
    Product.countDocuments(filter),
  ]);

  return {
    data,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
}

async function getProductById(id) {
  const filter = buildBaseFilter();
  filter._id = id;
  return Product.findOne(filter).lean();
}

async function getRelatedProducts(productId, category, limit = 4) {
  const filter = buildBaseFilter();
  filter.category = category;
  filter._id = { $ne: productId };
  return Product.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
}

module.exports = { listProducts, getProductById, getRelatedProducts };
