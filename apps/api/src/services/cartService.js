const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const reservationService = require('./reservationService');
const discountService = require('./discountService');
const shippingService = require('./shippingService');
const { createAuditEvent } = require('../domain/audit');
const logger = require('../config/logger');

class CartError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
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

async function getDefaultShippingCost(currency) {
  try {
    const method = await shippingService.getDefaultShippingMethod();
    if (method) return { amount: method.cost, currency: method.currency };
  } catch (err) {
    logger.error({ err }, 'Failed to get default shipping method');
  }
  return { amount: 0, currency: currency || 'EGP' };
}

async function computeCartDiscount(cart) {
  const subtotal = computeSubtotal(cart.items);
  if (!subtotal) return { discount: null, shipping: await getDefaultShippingCost(), total: null };

  try {
    const shipping = await getDefaultShippingCost(subtotal.currency);
    const discount = await discountService.findBestDiscount({
      subtotal: subtotal.amount,
      shippingCost: shipping.amount,
      currency: subtotal.currency,
      manualCode: cart.appliedPromoCode,
    });

    const discountAmount = discount?.amount || 0;
    const total = Math.max(0, subtotal.amount - discountAmount) + shipping.amount;

    return { discount, shipping, total: { amount: total, currency: subtotal.currency } };
  } catch (err) {
    logger.error({ err }, 'Failed to compute cart discount');
    const shipping = await getDefaultShippingCost(subtotal.currency);
    return {
      discount: null,
      shipping,
      total: { amount: subtotal.amount + shipping.amount, currency: subtotal.currency },
    };
  }
}

async function clearInvalidPromoCode(cart) {
  if (!cart.appliedPromoCode) return;
  const subtotal = computeSubtotal(cart.items);
  if (!subtotal) {
    cart.appliedPromoCode = null;
    return;
  }
  try {
    await discountService.validatePromoCode(cart.appliedPromoCode, subtotal.amount, subtotal.currency);
  } catch {
    cart.appliedPromoCode = null;
    cart.markModified('appliedPromoCode');
  }
}

function formatCartResponse(cart, availabilityMap = {}, discountInfo = null) {
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

  const subtotal = computeSubtotal(items);
  const result = {
    cartId: cart._id.toString(),
    items,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal,
    appliedPromoCode: cart.appliedPromoCode || null,
  };

  if (discountInfo) {
    result.discount = discountInfo.discount;
    result.shipping = discountInfo.shipping;
    result.total = discountInfo.total;
  }

  return result;
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

async function getOrCreateCart(cartId, userId = null) {
  if (userId) {
    const userCart = await Cart.findOne({ userId }).sort({ updatedAt: -1 });
    if (userCart) return userCart;
    return Cart.create({ userId, items: [] });
  }
  if (cartId && mongoose.Types.ObjectId.isValid(cartId)) {
    const existing = await Cart.findById(cartId);
    if (existing) return existing;
  }
  return Cart.create({ items: [] });
}

async function getCart(cartId, userId = null) {
  let cart = null;
  if (userId) {
    cart = await Cart.findOne({ userId }).sort({ updatedAt: -1 });
  }
  if (!cart && cartId && mongoose.Types.ObjectId.isValid(cartId)) {
    cart = await Cart.findById(cartId);
  }
  if (!cart) return null;
  const availabilityMap = await buildAvailabilityMap(cart);
  const discountInfo = await computeCartDiscount(cart);
  return formatCartResponse(cart, availabilityMap, discountInfo);
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

  const cart = await getOrCreateCart(cartId, meta.userId || null);
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

  await clearInvalidPromoCode(cart);
  if (cart.isModified('appliedPromoCode')) await cart.save();

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
  const discountInfo = await computeCartDiscount(cart);
  return formatCartResponse(cart, availabilityMap, discountInfo);
}

async function updateItem(cartId, productId, quantity, meta = {}) {
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new CartError('Invalid productId', 400);
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new CartError('Quantity must be between 1 and 99', 400);
  }

  let cart = null;
  if (meta.userId) {
    cart = await Cart.findOne({ userId: meta.userId }).sort({ updatedAt: -1 });
  }
  if (!cart && cartId && mongoose.Types.ObjectId.isValid(cartId)) {
    cart = await Cart.findById(cartId);
  }
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

  await clearInvalidPromoCode(cart);
  if (cart.isModified('appliedPromoCode')) await cart.save();

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
  const discountInfo = await computeCartDiscount(cart);
  return formatCartResponse(cart, availabilityMap, discountInfo);
}

async function removeItem(cartId, productId, meta = {}) {
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    throw new CartError('Invalid productId', 400);
  }

  let cart = null;
  if (meta.userId) {
    cart = await Cart.findOne({ userId: meta.userId }).sort({ updatedAt: -1 });
  }
  if (!cart && cartId && mongoose.Types.ObjectId.isValid(cartId)) {
    cart = await Cart.findById(cartId);
  }
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

  await clearInvalidPromoCode(cart);
  if (cart.isModified('appliedPromoCode')) await cart.save();

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
  const discountInfo = await computeCartDiscount(cart);
  return formatCartResponse(cart, availabilityMap, discountInfo);
}

async function clearCart(cartId, meta = {}) {
  let cart = null;
  if (meta.userId) {
    cart = await Cart.findOne({ userId: meta.userId }).sort({ updatedAt: -1 });
  }
  if (!cart && cartId && mongoose.Types.ObjectId.isValid(cartId)) {
    cart = await Cart.findById(cartId);
  }
  if (!cart) return { cartId: null, items: [], itemCount: 0, subtotal: null };

  const beforeCount = cart.items.reduce((s, i) => s + i.quantity, 0);
  cart.items = [];
  cart.appliedPromoCode = null;
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

  const shipping = await getDefaultShippingCost();
  return {
    cartId: cart._id.toString(),
    items: [],
    itemCount: 0,
    subtotal: null,
    discount: null,
    shipping,
    total: { amount: shipping.amount, currency: shipping.currency },
  };
}

async function refreshCart(cartId, userId = null) {
  let cart = null;
  if (userId) {
    cart = await Cart.findOne({ userId }).sort({ updatedAt: -1 });
  }
  if (!cart && cartId && mongoose.Types.ObjectId.isValid(cartId)) {
    cart = await Cart.findById(cartId);
  }
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
  const discountInfo = await computeCartDiscount(cart);
  return formatCartResponse(cart, availabilityMap, discountInfo);
}

async function applyPromoCode(cartId, userId, code) {
  let cart = null;
  if (userId) {
    cart = await Cart.findOne({ userId }).sort({ updatedAt: -1 });
  }
  if (!cart && cartId && mongoose.Types.ObjectId.isValid(cartId)) {
    cart = await Cart.findById(cartId);
  }
  if (!cart) throw new CartError('Cart not found', 404);

  const subtotal = computeSubtotal(cart.items);
  if (!subtotal) {
    throw new CartError('Cart is empty', 400);
  }

  // Validate the code
  await discountService.validatePromoCode(code, subtotal.amount, subtotal.currency);

  cart.appliedPromoCode = code.toUpperCase().trim();
  cart.updatedAt = new Date();
  await cart.save();

  const availabilityMap = await buildAvailabilityMap(cart);
  const discountInfo = await computeCartDiscount(cart);
  return formatCartResponse(cart, availabilityMap, discountInfo);
}

async function removePromoCode(cartId, userId) {
  let cart = null;
  if (userId) {
    cart = await Cart.findOne({ userId }).sort({ updatedAt: -1 });
  }
  if (!cart && cartId && mongoose.Types.ObjectId.isValid(cartId)) {
    cart = await Cart.findById(cartId);
  }
  if (!cart) throw new CartError('Cart not found', 404);

  cart.appliedPromoCode = null;
  cart.updatedAt = new Date();
  await cart.save();

  const availabilityMap = await buildAvailabilityMap(cart);
  const discountInfo = await computeCartDiscount(cart);
  return formatCartResponse(cart, availabilityMap, discountInfo);
}

async function mergeGuestCart(guestCartId, userId) {
  if (!guestCartId || !mongoose.Types.ObjectId.isValid(guestCartId)) {
    return null;
  }
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  const guestCart = await Cart.findById(guestCartId);
  if (!guestCart || guestCart.items.length === 0) {
    return null;
  }

  let userCart = await Cart.findOne({ userId }).sort({ updatedAt: -1 });
  if (!userCart) {
    userCart = await Cart.create({ userId, items: [] });
  }

  for (const guestItem of guestCart.items) {
    const existingIndex = userCart.items.findIndex(
      (i) => i.productId.toString() === guestItem.productId.toString()
    );

    if (existingIndex >= 0) {
      const combinedQty = userCart.items[existingIndex].quantity + guestItem.quantity;
      userCart.items[existingIndex].quantity = Math.min(combinedQty, 99);
    } else if (userCart.items.length < 20) {
      userCart.items.push({
        productId: guestItem.productId,
        name: guestItem.name,
        sku: guestItem.sku,
        image: guestItem.image,
        quantity: guestItem.quantity,
        unitPrice: guestItem.unitPrice,
        addedAt: new Date(),
      });
    }
  }

  // Carry over the guest's applied promo code if the user cart has none
  if (!userCart.appliedPromoCode && guestCart.appliedPromoCode) {
    userCart.appliedPromoCode = guestCart.appliedPromoCode;
  }

  userCart.updatedAt = new Date();
  await userCart.save();

  // Transfer reservations from guest cart to user cart
  await reservationService.releaseAll(guestCart._id);
  for (const item of userCart.items) {
    await reservationService.reserve(userCart._id, item.productId, item.quantity);
  }

  // Delete guest cart
  await Cart.findByIdAndDelete(guestCart._id);

  const availabilityMap = await buildAvailabilityMap(userCart);
  return formatCartResponse(userCart, availabilityMap);
}

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  refreshCart,
  applyPromoCode,
  removePromoCode,
  computeSubtotal,
  mergeGuestCart,
  CartError,
};
