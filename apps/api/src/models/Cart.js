const mongoose = require('mongoose');
const env = require('../config/env');

const cartLineItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    image: { type: String, default: null },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 99,
    },
    unitPrice: {
      amount: { type: Number, required: true },
      currency: { type: String, required: true, length: 3 },
    },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    items: {
      type: [cartLineItemSchema],
      default: [],
      validate: {
        validator(arr) {
          return arr.length <= 20;
        },
        message: 'Cart cannot hold more than 20 items',
      },
    },
  },
  {
    timestamps: true,
  }
);

// TTL: auto-delete carts inactive for CART_TTL_DAYS
cartSchema.index(
  { updatedAt: 1 },
  { expireAfterSeconds: env.CART_TTL_DAYS * 24 * 60 * 60 }
);

module.exports = mongoose.model('Cart', cartSchema);
