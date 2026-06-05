const { Router } = require('express');
const multer = require('multer');
const authenticate = require('../../../middleware/authenticate');
const requirePermission = require('../../../middleware/requirePermission');
const { rateLimiterAdmin } = require('../../../middleware/rateLimitAdmin');
const uploadService = require('../../../services/uploadService');

const router = Router();

router.use(authenticate, requirePermission('admin:access'), rateLimiterAdmin);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(req, file, cb) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only jpeg, png, and webp images are allowed'));
    }
  },
});

// POST /api/v1/admin/uploads
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: 'No file uploaded' });
    }
    const result = await uploadService.uploadImage(req.file.buffer, req.file.mimetype);
    res.json({ url: result.url });
  } catch (err) {
    if (err.statusCode === 501) {
      return res.status(501).json({ error: true, message: err.message });
    }
    next(err);
  }
});

module.exports = router;
