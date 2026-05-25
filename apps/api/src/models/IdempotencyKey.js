const mongoose = require('mongoose');
const env = require('../config/env');

const idempotencyKeySchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    response: { type: mongoose.Schema.Types.Mixed, required: true },
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

idempotencyKeySchema.index({ key: 1 });

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);
