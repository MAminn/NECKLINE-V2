const mongoose = require('mongoose');

/**
 * Persisted checkout session.
 *
 * Replaces the previous in-memory Map, which lost all in-flight checkouts on restart
 * and broke under horizontal scaling (a session created on one instance was invisible
 * to another). Mongo's TTL index expires sessions automatically, mirroring the pattern
 * already used by reservations and idempotency keys.
 *
 * The `data` blob is the opaque session snapshot (line items, totals, discount, contact,
 * shipping). It is read once at order time and deleted, so it is stored as-is.
 */
const checkoutSessionSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      expires: 0, // TTL: document deleted when expiresAt < now
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CheckoutSession', checkoutSessionSchema);
