const logger = require('../config/logger');

async function uploadImage(buffer, _mimetype) {
  if (!process.env.CLOUDINARY_URL) {
    const err = new Error('Image upload service is not configured');
    err.statusCode = 501;
    throw err;
  }

  // Lazy-require to avoid hard dependency when Cloudinary is not configured
  const cloudinary = require('cloudinary').v2;

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder: 'neckline' },
      (error, result) => {
        if (error) {
          logger.error({ error }, 'Cloudinary upload failed');
          return reject(error);
        }
        resolve({ url: result.secure_url });
      }
    );
    stream.end(buffer);
  });
}

module.exports = { uploadImage };
