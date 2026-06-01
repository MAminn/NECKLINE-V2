const Reservation = require('../models/Reservation');
const env = require('../config/env');

function defaultExpiry() {
  return new Date(Date.now() + env.RESERVATION_TTL_MINUTES * 60 * 1000);
}

async function reserve(cartId, productId, quantity) {
  return Reservation.findOneAndUpdate(
    { cartId, productId },
    { quantity, expiresAt: defaultExpiry() },
    { upsert: true, new: true }
  );
}

async function release(cartId, productId) {
  await Reservation.deleteOne({ cartId, productId });
}

async function releaseAll(cartId) {
  await Reservation.deleteMany({ cartId });
}

async function getAvailability(productId, excludeCartId) {
  const match = { productId };
  if (excludeCartId) {
    match.cartId = { $ne: excludeCartId };
  }

  const result = await Reservation.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$quantity' } } },
  ]);

  return result[0]?.total || 0;
}

async function extend(cartId, productId, quantity) {
  return Reservation.findOneAndUpdate(
    { cartId, productId },
    { quantity, expiresAt: defaultExpiry() },
    { upsert: true, new: true }
  );
}

module.exports = {
  reserve,
  release,
  releaseAll,
  getAvailability,
  extend,
};
