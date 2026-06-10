const crypto = require('node:crypto');

/**
 * Constant-time string comparison. Hashing both inputs first equalizes
 * lengths so timingSafeEqual can be used without leaking length information.
 */
function timingSafeStringEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    throw new TypeError('timingSafeStringEqual expects both arguments to be strings');
  }
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

module.exports = { timingSafeStringEqual };
