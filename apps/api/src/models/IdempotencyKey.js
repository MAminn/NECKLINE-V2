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

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);
