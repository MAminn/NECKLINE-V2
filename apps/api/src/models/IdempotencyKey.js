const mongoose = require('mongoose');
const env = require('../config/env');

const idempotencyKeySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    // 'in_progress' is a reservation written BEFORE the handler runs so concurrent
    // duplicates collide on the unique index instead of both executing.
    // 'completed' carries the stored response for replay.
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
    },
    statusCode: { type: Number, default: 200 },
    response: { type: mongoose.Schema.Types.Mixed },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: env.IDEMPOTENCY_TTL_HOURS * 3600,
    },
  },
  {
    timestamps: false,
  }
);

// Reservations that never complete (cleanup deleteOne failed, process died before
// res.json, request aborted) would otherwise 409 the key until the 24h TTL above.
// This partial TTL index expires only 'in_progress' records on a short fuse;
// 'completed' records leave the partial index and keep the full replay window.
// Explicit name required: the key pattern duplicates the `expires` index above.
idempotencyKeySchema.index(
  { createdAt: 1 },
  {
    name: 'in_progress_ttl',
    expireAfterSeconds: env.IDEMPOTENCY_IN_PROGRESS_TTL_MINUTES * 60,
    partialFilterExpression: { status: 'in_progress' },
  }
);

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);
