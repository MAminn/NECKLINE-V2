const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    price: {
      amount: { type: Number, required: true },
      currency: { type: String, required: true, length: 3 },
    },
    stockOnHand: { type: Number, default: 0, min: 0 },
    version: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    images: [{ type: String }],
    category: { type: String, trim: true },
    tags: [{ type: String, trim: true }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

productSchema.index({ category: 1, isActive: 1, deletedAt: 1 });
productSchema.index({ tags: 1 });

module.exports = mongoose.model('Product', productSchema);
