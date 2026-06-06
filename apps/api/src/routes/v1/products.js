const { Router } = require('express');
const { z } = require('zod');
const { listProducts, getProductById, getRelatedProducts } = require('../../services/productService');

const router = Router();

const listQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  category: z.string().trim().optional(),
  tags: z.string().trim().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'name_asc', 'name_desc', 'newest']).optional(),
  inStock: z.enum(['true', 'false']).optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const result = await listProducts(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const related = await getRelatedProducts(product._id, product.category);
    res.json({ product, related });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
