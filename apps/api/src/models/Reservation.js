const mongoose = require('mongoose');
const env = require('../config/env');

const reservationSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      expires: 0, // TTL: document deleted when expiresAt < now
    },
  },
  {
    timestamps: false,
  }
);

// Unique constraint: one reservation per (cart, product)
reservationSchema.index({ cartId: 1, productId: 1 }, { unique: true });

// Support availability aggregation by product
reservationSchema.index({ productId: 1 });

function defaultExpiry() {
  return new Date(Date.now() + env.RESERVATION_TTL_MINUTES * 60 * 1000);
}

module.exports = mongoose.model('Reservation', reservationSchema);
module.exports.defaultExpiry = defaultExpiry;
