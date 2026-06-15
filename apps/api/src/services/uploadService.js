const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const logger = require('../config/logger');

function extensionFromMimetype(mimetype) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[mimetype] || 'jpg';
}

async function uploadLocal(buffer, mimetype) {
  const ext = extensionFromMimetype(mimetype);
  const filename = `${crypto.randomUUID()}.${ext}`;
  const uploadsDir = path.join(__dirname, '../../public/uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, filename), buffer);
  return { url: `/uploads/${filename}` };
}

async function uploadCloudinary(buffer, _mimetype) {
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

async function uploadImage(buffer, mimetype) {
  if (!process.env.CLOUDINARY_URL) {
    logger.info('CLOUDINARY_URL not set; using local file storage for upload');
    return uploadLocal(buffer, mimetype);
  }

  return uploadCloudinary(buffer, mimetype);
}

module.exports = { uploadImage };
