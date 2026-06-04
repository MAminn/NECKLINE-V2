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

// Phase 6: content routes (public reads + admin writes)
const testimonialRoutes = require('./testimonials');
const { publicRouter: headerSlidesPublic, adminRouter: headerSlidesAdmin } = require('./headerSlides');
const { publicRouter: howToApplyPublic, adminRouter: howToApplyAdmin } = require('./howToApply');

// Phase 6: admin-only routes
const adminMetricsRoutes = require('./admin/metrics');
const adminActivitiesRoutes = require('./admin/activities');
const adminProductsRoutes = require('./admin/products');
const adminOrdersRoutes = require('./admin/orders');
const adminCustomersRoutes = require('./admin/customers');
const adminCouponsRoutes = require('./admin/coupons');
const adminOffersRoutes = require('./admin/offers');
const adminActivityLogRoutes = require('./admin/activityLog');
const adminUploadsRoutes = require('./admin/uploads');

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

// Phase 6: content routes
router.use('/testimonials', testimonialRoutes);
router.use('/header-slides', headerSlidesPublic);
router.use('/how-to-apply', howToApplyPublic);
router.use('/admin/header-slides', headerSlidesAdmin);
router.use('/admin/how-to-apply', howToApplyAdmin);

// Phase 6: admin-only routes
router.use('/admin/metrics', adminMetricsRoutes);
router.use('/admin/activities', adminActivitiesRoutes);
router.use('/admin/products', adminProductsRoutes);
router.use('/admin/orders', adminOrdersRoutes);
router.use('/admin/customers', adminCustomersRoutes);
router.use('/admin/coupons', adminCouponsRoutes);
router.use('/admin/offers', adminOffersRoutes);
router.use('/admin/activity-log', adminActivityLogRoutes);
router.use('/admin/uploads', adminUploadsRoutes);

module.exports = router;
