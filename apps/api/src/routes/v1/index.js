const { Router } = require('express');
const healthRoutes = require('./health');
const productsRoutes = require('./products');
const cartRoutes = require('./cart');
const authRoutes = require('./auth');
const checkoutRoutes = require('./checkout');
const ordersRoutes = require('./orders');
const featureRoutes = require('./admin/features');
const promoCodeRoutes = require('./promoCodes');
const adminPromoCodeRoutes = require('./admin/promoCodes');
const quizRoutes = require('./quiz');

const router = Router();

router.use('/health', healthRoutes);
router.use('/products', productsRoutes);
router.use('/cart', cartRoutes);
router.use('/auth', authRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/orders', ordersRoutes);
router.use('/promo-codes', promoCodeRoutes);
router.use('/admin/features', featureRoutes);
router.use('/admin/promo-codes', adminPromoCodeRoutes);
router.use('/quiz', quizRoutes);

module.exports = router;
