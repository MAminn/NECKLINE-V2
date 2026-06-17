const { Router } = require('express');
const { csrfProtection, issueCsrfToken } = require('../../middleware/csrf');
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

// Phase 6: admin-only routes
const adminMetricsRoutes = require('./admin/metrics');
const adminActivitiesRoutes = require('./admin/activities');
const adminProductsRoutes = require('./admin/products');
const adminOrdersRoutes = require('./admin/orders');
const adminCustomersRoutes = require('./admin/customers');
const adminCouponsRoutes = require('./admin/coupons');
const adminOffersRoutes = require('./admin/offers');
const adminUploadsRoutes = require('./admin/uploads');

const router = Router();

// CSRF bootstrap + protection. The token endpoint must be registered first;
// csrfProtection only inspects state-changing methods, so GETs are unaffected.
// The Paymob webhook is mounted in app.js BEFORE this router (HMAC-verified),
// so it is intentionally outside CSRF protection.
router.get('/csrf', (req, res) => {
  res.json({ csrfToken: issueCsrfToken(res) });
});
router.use(csrfProtection);

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
router.use('/admin/header-slides', headerSlidesAdmin);

// Phase 6: admin-only routes
router.use('/admin/metrics', adminMetricsRoutes);
router.use('/admin/activities', adminActivitiesRoutes);
router.use('/admin/products', adminProductsRoutes);
router.use('/admin/orders', adminOrdersRoutes);
router.use('/admin/customers', adminCustomersRoutes);
router.use('/admin/coupons', adminCouponsRoutes);
router.use('/admin/offers', adminOffersRoutes);
router.use('/admin/uploads', adminUploadsRoutes);

module.exports = router;
