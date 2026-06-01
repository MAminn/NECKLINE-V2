const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const reservationService = require('./reservationService');
const { createAuditEvent } = require('../domain/audit');
const logger = require('../config/logger');

class CartError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function computeSubtotal(items) {
  if (!items || items.length === 0) return null;
  const currency = items[0].unitPrice.currency;
  let total = 0;
  for (const item of items) {
    if (item.unitPrice.currency !== currency) {
      throw new CartError('Mixed currencies in cart are not supported', 422);
    }
    total += item.quantity * item.unitPrice.amount;
  }
  return { amount: total, currency };
}

function formatCartResponse(cart, availabilityMap = {}) {
  const items = cart.items.map((item) => {
    const reserved = availabilityMap[item.productId.toString()]?.reserved ?? false;
    const available = availabilityMap[item.productId.toString()]?.available ?? false;
    return {
      productId: item.productId.toString(),
      name: item.name,
      sku: item.sku,
      image: item.image,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: {
        amount: item.quantity * item.unitPrice.amount,
        currency: item.unitPrice.currency,
      },
      available,
      reserved,
    };
  });

  return {
    cartId: cart._id.toString(),
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: computeSubtotal(items),
  };
}

async function buildAvailabilityMap(cart) {
  const map = {};
  for (const item of cart.items) {
    const pid = item.productId.toString();
    const product = await Product.findById(item.productId).lean();
    const reservedDoc = await mongoose
      .model('Reservation')
      .findOne({ cartId: cart._id, productId: item.productId })
      .lean();

    const otherReserved = await reservationService.getAvailability(item.productId, cart._id);
    const available = product && product.purchasable && !product.deletedAt && product.stockOnHand - otherReserved >= item.quantity;

    map[pid] = {
      available,
      reserved: !!reservedDoc && reservedDoc.expiresAt > new Date(),
    };
  }
  return map;
}

async function getOrCreateCart(cartId) {
  if (cartId && mongoose.Types.ObjectId.isValid(cartId)) {
    const existing = await Cart.findById(cartId);
    if (existing) return existing;
  }
  return Cart.create({ items: [] });
}

async function getCart(cartId) {
  if (!cartId || !mongoose.Types.ObjectId.isValid(cartId)) return null;
  const cart = await Cart.findById(cartId);
  if (!cart) return null;
  const availabilityMap = await buildAvailabilityMap(cart);
  return formatCartResponse(cart, availabilityMap);
}

async function addItem(cartId, productId, quantity, meta = {}) {
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new CartError('Invalid productId', 400);
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new CartError('Quantity must be between 1 and 99', 400);
  }

  const product = await Product.findById(productId).lean();
  if (!product || product.deletedAt || !product.purchasable) {
    throw new CartError('Product is not available', 409);
  }

  const cart = await getOrCreateCart(cartId);
  const existingIndex = cart.items.findIndex((i) => i.productId.toString() === productId);
  const currentQty = existingIndex >= 0 ? cart.items[existingIndex].quantity : 0;
  const newTotalQty = currentQty + quantity;

  if (existingIndex < 0 && cart.items.length >= 20) {
    throw new CartError('Cart can hold at most 20 items', 422);
  }

  const otherReserved = await reservationService.getAvailability(productId, cart._id);
  const available = product.stockOnHand - otherReserved;
  if (newTotalQty > available) {
    const remaining = available - currentQty;
    throw new CartError(`Only ${Math.max(0, remaining)} more units available`, 409);
  }

  if (existingIndex >= 0) {
    cart.items[existingIndex].quantity = newTotalQty;
  } else {
    cart.items.push({
      productId: product._id,
      name: product.name,
      sku: product.sku,
      image: product.images?.[0] || null,
      quantity: newTotalQty,
      unitPrice: { amount: product.price, currency: product.currency },
      addedAt: new Date(),
    });
  }

  cart.updatedAt = new Date();
  await cart.save();
  await reservationService.extend(cart._id, productId, newTotalQty);

  if (meta.requestId) {
    createAuditEvent({
      actor: 'guest',
      action: 'cart.addItem',
      target: cart._id.toString(),
      targetType: 'Cart',
      before: { quantity: currentQty },
      after: { quantity: newTotalQty, productId },
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
  }

  const availabilityMap = await buildAvailabilityMap(cart);
  return formatCartResponse(cart, availabilityMap);
}

async function updateItem(cartId, productId, quantity, meta = {}) {
  if (!cartId || !mongoose.Types.ObjectId.isValid(cartId)) {
    throw new CartError('Cart not found', 404);
  }
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new CartError('Invalid productId', 400);
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new CartError('Quantity must be between 1 and 99', 400);
  }

  const cart = await Cart.findById(cartId);
  if (!cart) throw new CartError('Cart not found', 404);

  const itemIndex = cart.items.findIndex((i) => i.productId.toString() === productId);
  if (itemIndex < 0) throw new CartError('Item not found in cart', 404);

  const product = await Product.findById(productId).lean();
  if (!product) throw new CartError('Product not found', 404);

  const otherReserved = await reservationService.getAvailability(productId, cart._id);
  const available = product.stockOnHand - otherReserved;
  if (quantity > available) {
    throw new CartError(`Only ${available} units available`, 409);
  }

  const beforeQty = cart.items[itemIndex].quantity;
  cart.items[itemIndex].quantity = quantity;
  cart.updatedAt = new Date();
  await cart.save();

  await reservationService.extend(cart._id, productId, quantity);

  if (meta.requestId) {
    createAuditEvent({
      actor: 'guest',
      action: 'cart.updateItem',
      target: cart._id.toString(),
      targetType: 'Cart',
      before: { quantity: beforeQty },
      after: { quantity, productId },
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
  }

  const availabilityMap = await buildAvailabilityMap(cart);
  return formatCartResponse(cart, availabilityMap);
}

async function removeItem(cartId, productId, meta = {}) {
  if (!cartId || !mongoose.Types.ObjectId.isValid(cartId)) {
    throw new CartError('Cart not found', 404);
  }
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new CartError('Invalid productId', 400);
  }

  const cart = await Cart.findById(cartId);
  if (!cart) throw new CartError('Cart not found', 404);

  const itemIndex = cart.items.findIndex((i) => i.productId.toString() === productId);
  if (itemIndex < 0) {
    throw new CartError('Item not found in cart', 404);
  }

  const beforeLength = cart.items.length;
  cart.items.splice(itemIndex, 1);
  cart.markModified('items');
  cart.updatedAt = new Date();
  await cart.save();
  await reservationService.release(cart._id, productId);

  if (meta.requestId) {
    createAuditEvent({
      actor: 'guest',
      action: 'cart.removeItem',
      target: cart._id.toString(),
      targetType: 'Cart',
      before: { itemCount: beforeLength },
      after: { itemCount: cart.items.length, productId },
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
  }

  const availabilityMap = await buildAvailabilityMap(cart);
  return formatCartResponse(cart, availabilityMap);
}

async function clearCart(cartId, meta = {}) {
  if (!cartId || !mongoose.Types.ObjectId.isValid(cartId)) {
    return { cartId: null, items: [], itemCount: 0, subtotal: null };
  }

  const cart = await Cart.findById(cartId);
  if (!cart) return { cartId: null, items: [], itemCount: 0, subtotal: null };

  const beforeCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  cart.items = [];
  cart.updatedAt = new Date();
  await cart.save();
  await reservationService.releaseAll(cart._id);

  if (meta.requestId) {
    createAuditEvent({
      actor: 'guest',
      action: 'cart.clear',
      target: cart._id.toString(),
      targetType: 'Cart',
      before: { itemCount: beforeCount },
      after: { itemCount: 0 },
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
  }

  return { cartId: cart._id.toString(), items: [], itemCount: 0, subtotal: null };
}

async function refreshCart(cartId) {
  if (!cartId || !mongoose.Types.ObjectId.isValid(cartId)) {
    throw new CartError('Cart not found', 404);
  }

  const cart = await Cart.findById(cartId);
  if (!cart) throw new CartError('Cart not found', 404);

  for (const item of cart.items) {
    const product = await Product.findById(item.productId).lean();
    const otherReserved = await reservationService.getAvailability(item.productId, cart._id);
    const available = product && product.purchasable && !product.deletedAt && product.stockOnHand - otherReserved >= item.quantity;

    if (available) {
      await reservationService.extend(cart._id, item.productId, item.quantity);
    }
  }

  cart.updatedAt = new Date();
  await cart.save();

  const availabilityMap = await buildAvailabilityMap(cart);
  return formatCartResponse(cart, availabilityMap);
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  refreshCart,
  computeSubtotal,
  CartError,
};
