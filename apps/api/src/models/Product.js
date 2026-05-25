const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    sku: { type: String, required: true, unique: true, trim: true },
    price: { type: Number, required: true }, // integer minor units
    currency: { type: String, required: true, default: 'EGP' },
    stockOnHand: { type: Number, default: 0, min: 0 },
    version: { type: Number, default: 0 },
    purchasable: { type: Boolean, default: true },
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

// Catalog listing indexes (ESR rule)
productSchema.index({ purchasable: 1, deletedAt: 1, createdAt: -1 }); // base catalog query
productSchema.index({ category: 1, purchasable: 1, deletedAt: 1, createdAt: -1 }); // category filter
productSchema.index({ tags: 1, purchasable: 1, deletedAt: 1, createdAt: -1 }); // tag browsing
productSchema.index({ stockOnHand: 1, purchasable: 1, deletedAt: 1 }); // in-stock filter
productSchema.index({ name: 'text', description: 'text' }); // text search (non-authoritative)

module.exports = mongoose.model('Product', productSchema);
