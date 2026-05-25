const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    enabled: { type: Boolean, default: false },
    scope: {
      type: String,
      enum: ['payment', 'pricing', 'stock', 'global'],
      required: true,
    },
    description: { type: String, trim: true },
    changedBy: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

featureFlagSchema.index({ scope: 1, enabled: 1 });

module.exports = mongoose.model('FeatureFlag', featureFlagSchema);
