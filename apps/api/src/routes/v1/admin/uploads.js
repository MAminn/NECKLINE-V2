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

function toAbsoluteUrl(req, urlPath) {
  if (!urlPath.startsWith('/')) return urlPath;
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('x-forwarded-host') || req.get('host');
  return `${protocol}://${host}${urlPath}`;
}

// POST /api/v1/admin/uploads
router.post('/', upload.single('file'), async (req, res, _next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: 'No file uploaded' });
    }
    const result = await uploadService.uploadImage(req.file.buffer, req.file.mimetype);
    res.json({ url: toAbsoluteUrl(req, result.url) });
  } catch (err) {
    const message = err.message || 'Upload failed';
    if (err.statusCode === 501) {
      return res.status(501).json({ error: true, message });
    }
    if (err.statusCode === 400) {
      return res.status(400).json({ error: true, message });
    }
    // Return Cloudinary / service errors with a 500 but include the message for debugging
    return res.status(500).json({ error: true, message });
  }
});

module.exports = router;
