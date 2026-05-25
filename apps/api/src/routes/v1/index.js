const { Router } = require('express');
const healthRoutes = require('./health');
const featureRoutes = require('./admin/features');

const router = Router();

router.use('/health', healthRoutes);
router.use('/admin/features', featureRoutes);

module.exports = router;
