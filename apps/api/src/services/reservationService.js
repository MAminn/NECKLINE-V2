const mongoose = require('mongoose');
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

// Aggregation pipelines are not casted by Mongoose, so coerce explicitly —
// a string productId would silently match nothing against ObjectId documents.
function toObjectId(id) {
  return id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(id);
}

async function getAvailability(productId, excludeCartId) {
  const match = { productId: toObjectId(productId) };
  if (excludeCartId) {
    match.cartId = { $ne: excludeCartId };
  }

  const result = await Reservation.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$quantity' } } },
  ]);

  return result[0]?.total || 0;
}

// Batched form of getAvailability: one aggregation for many products.
// Returns { [productId]: totalReservedByOtherCarts }.
async function getAvailabilityBulk(productIds, excludeCartId) {
  if (!productIds || productIds.length === 0) return {};

  const match = { productId: { $in: productIds.map(toObjectId) } };
  if (excludeCartId) {
    match.cartId = { $ne: excludeCartId };
  }

  const results = await Reservation.aggregate([
    { $match: match },
    { $group: { _id: '$productId', total: { $sum: '$quantity' } } },
  ]);

  const map = {};
  for (const row of results) {
    map[row._id.toString()] = row.total;
  }
  return map;
}

// All of this cart's reservations for the given products, in one query.
async function findForCart(cartId, productIds) {
  if (!productIds || productIds.length === 0) return [];
  return Reservation.find({ cartId, productId: { $in: productIds } }).lean();
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
  getAvailabilityBulk,
  findForCart,
  extend,
};
