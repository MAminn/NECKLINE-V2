const crypto = require('node:crypto');

/**
 * Generates a unique, human-readable order number.
 * Format: NECK-{timestamp}-{random}
 *
 * The suffix uses crypto.randomBytes (8 hex chars = 32 bits) so order
 * numbers cannot be enumerated by guessing around a known timestamp.
 */
function generateOrderNumber() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `NECK-${timestamp}-${random}`;
}

module.exports = { generateOrderNumber };
