const mongoose = require('mongoose');

const shippingMethodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    cost: { type: Number, required: true, min: 0 }, // integer minor units
    currency: { type: String, required: true, default: 'EGP' },
    estimatedMinDays: { type: Number, min: 0 },
    estimatedMaxDays: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

shippingMethodSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('ShippingMethod', shippingMethodSchema);
