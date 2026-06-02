/**
 * Generates a unique, human-readable order number.
 * Format: NECK-{timestamp}-{random}
 */
function generateOrderNumber() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NECK-${timestamp}-${random}`;
}

module.exports = { generateOrderNumber };
