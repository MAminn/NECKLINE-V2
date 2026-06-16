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
  let cloudinary;
  try {
    cloudinary = require('cloudinary').v2;
    cloudinary.config({ secure: true });
  } catch (err) {
    logger.error({ err }, 'Cloudinary package is not installed');
    const error = new Error('Cloudinary package is missing. Run "npm install cloudinary" in apps/api.');
    error.statusCode = 501;
    throw error;
  }

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

function isValidCloudinaryUrl(url) {
  return typeof url === 'string' && url.startsWith('cloudinary://');
}

async function uploadImage(buffer, mimetype) {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (!cloudinaryUrl) {
    logger.info('CLOUDINARY_URL not set; using local file storage for upload');
    return uploadLocal(buffer, mimetype);
  }

  if (!isValidCloudinaryUrl(cloudinaryUrl)) {
    const error = new Error('CLOUDINARY_URL is set but does not look like a valid Cloudinary URL (expected cloudinary://...).');
    error.statusCode = 400;
    throw error;
  }

  logger.info('Uploading image to Cloudinary');
  return uploadCloudinary(buffer, mimetype);
}

module.exports = { uploadImage };
