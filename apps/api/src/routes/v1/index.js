const { Router } = require('express');
const healthRoutes = require('./health');
const productsRoutes = require('./products');
const cartRoutes = require('./cart');
const authRoutes = require('./auth');
const featureRoutes = require('./admin/features');

const router = Router();

router.use('/health', healthRoutes);
router.use('/products', productsRoutes);
router.use('/cart', cartRoutes);
router.use('/auth', authRoutes);
router.use('/admin/features', featureRoutes);

module.exports = router;
