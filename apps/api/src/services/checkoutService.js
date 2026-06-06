const mongoose = require('mongoose');
const crypto = require('node:crypto');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const PaymentTransaction = require('../models/PaymentTransaction');
const PromoCode = require('../models/PromoCode');
const CheckoutSession = require('../models/CheckoutSession');
const { createPaymentProvider } = require('./payment/PaymentProviderFactory');
const { isEnabled } = require('../domain/features');
const { generateOrderNumber } = require('../utils/generateOrderNumber');
const { getDefaultShippingMethod } = require('./shippingService');
const cartService = require('./cartService');
const discountService = require('./discountService');
const { DiscountError } = require('./discountService');
const { createAuditEvent } = require('../domain/audit');
const logger = require('../config/logger');

// Checkout sessions are persisted (CheckoutSession model) with a Mongo TTL index so they
// survive restarts and are visible across instances. TTL: 15 minutes.
const CHECKOUT_SESSION_TTL_MS = 15 * 60 * 1000;

function createCheckoutToken() {
  return `cko_${crypto.randomBytes(16).toString('hex')}`;
}

// Checkout tokens arrive from request bodies, so coerce to a primitive string before
// building any query. This prevents an attacker-supplied object (e.g. { $gt: '' }) from
// being interpreted as a MongoDB query operator (NoSQL operator injection).
function normalizeToken(token) {
  return typeof token === 'string' ? token : null;
}

async function getCheckoutSession(token) {
  const safeToken = normalizeToken(token);
  if (!safeToken) return null;
  const doc = await CheckoutSession.findOne({ token: safeToken }).lean();
  return doc ? doc.data : null;
}

async function deleteCheckoutSession(token) {
  const safeToken = normalizeToken(token);
  if (!safeToken) return;
  await CheckoutSession.deleteOne({ token: safeToken });
}

class CheckoutError extends Error {
  constructor(message, statusCode = 400, code = 'CHECKOUT_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

async function validateCheckout({ cartId, userId }) {
  const cart = await cartService.getCart(cartId, userId);
  if (!cart?.items?.length) {
    throw new CheckoutError('Cart is empty', 400, 'EMPTY_CART');
  }

  // Check stock availability for all items
  const unavailableItems = cart.items.filter((item) => !item.available);
  if (unavailableItems.length > 0) {
    const names = unavailableItems.map((i) => i.name).join(', ');
    throw new CheckoutError(`The following items are no longer available: ${names}`, 409, 'STOCK_UNAVAILABLE');
  }

  return cart;
}

async function createCheckoutSession({ cartId, userId, contact, shippingAddress, promoCode }) {
  const cart = await validateCheckout({ cartId, userId });

  const shippingMethod = await getDefaultShippingMethod();
  if (!shippingMethod) {
    throw new CheckoutError('No shipping method available', 503, 'SHIPPING_UNAVAILABLE');
  }

  const subtotal = cart.subtotal?.amount || 0;
  const currency = cart.subtotal?.currency || 'EGP';
  const shippingCost = shippingMethod.cost;

  // Compute discount
  const discount = await discountService.findBestDiscount({
    subtotal,
    shippingCost,
    currency,
    manualCode: promoCode || cart.appliedPromoCode || null,
  });

  const discountAmount = discount?.amount || 0;
  const finalShippingCost = discount?.type === 'free_shipping' ? 0 : shippingCost;
  // free_shipping savings are captured by zeroing finalShippingCost; don't also subtract from subtotal
  const effectiveSubtotalDiscount = discount?.type === 'free_shipping' ? 0 : discountAmount;
  const total = Math.max(0, subtotal - effectiveSubtotalDiscount) + finalShippingCost;

  const token = createCheckoutToken();
  await CheckoutSession.create({
    token,
    expiresAt: new Date(Date.now() + CHECKOUT_SESSION_TTL_MS),
    data: {
      cartId: cart.cartId,
      userId: userId || null,
      contact,
      shippingAddress,
      shippingMethod,
      lineItems: cart.items,
      subtotal,
      shippingCost: finalShippingCost,
      originalShippingCost: shippingCost,
      discount,
      total,
      currency,
      promoCode: promoCode || cart.appliedPromoCode || null,
    },
  });

  return {
    checkoutToken: token,
    orderPreview: {
      lineItems: cart.items.map((item) => ({
        sku: item.sku,
        title: item.name,
        unitPrice: item.unitPrice.amount,
        currency: item.unitPrice.currency,
        quantity: item.quantity,
        lineTotal: item.lineTotal.amount,
      })),
      subtotal,
      discount,
      shipping: {
        method: shippingMethod.name,
        cost: finalShippingCost,
        currency: shippingMethod.currency,
      },
      total,
      currency,
    },
  };
}

// Reverses the side effects of a checkout whose payment never succeeded:
// cancels the order, restores stock, and refunds the promo usage — all atomically.
// If the compensation transaction itself fails, the released stock would otherwise be
// lost with only a log line, so we also emit a durable, queryable audit event that ops
// can reconcile against.
async function compensateFailedPayment({ order, lineItems, promoCode }) {
  const mongoSession = await mongoose.startSession();
  try {
    await mongoSession.withTransaction(async () => {
      await Order.findByIdAndUpdate(
        order._id,
        { status: 'cancelled', paymentStatus: 'failed' },
        { session: mongoSession }
      );
      for (const item of lineItems) {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stockOnHand: item.quantity, version: 1 } },
          { session: mongoSession }
        );
      }
      if (promoCode) {
        await PromoCode.findOneAndUpdate(
          { code: promoCode.toUpperCase().trim() },
          { $inc: { usageCount: -1 } },
          { session: mongoSession }
        );
      }
    });
  } catch (err) {
    logger.error({ err, orderId: order._id }, 'Payment compensation failed — manual intervention required');
    // Durable, queryable record of unreconciled stock — logs alone are not discoverable.
    createAuditEvent({
      actor: 'system',
      action: 'inventory.compensation_failed',
      target: order._id.toString(),
      targetType: 'Order',
      before: { status: order.status, paymentStatus: order.paymentStatus },
      after: {
        reason: err.message,
        promoCode: promoCode || null,
        lineItems: lineItems.map((i) => ({
          productId: i.productId,
          sku: i.sku,
          quantity: i.quantity,
        })),
      },
    }).catch((e) =>
      logger.error({ err: e, orderId: order._id }, 'Failed to record compensation-failure audit event')
    );
  } finally {
    await mongoSession.endSession();
  }
}

// ─── Shared checkout helpers (used by both the redirect and sync payment flows) ───

// Decrements stock for every line item using optimistic locking (AD-1), inside a transaction.
// Throws CheckoutError('STOCK_UNAVAILABLE') if any item can no longer be satisfied.
async function decrementStockForItems(lineItems, mongoSession) {
  for (const item of lineItems) {
    const product = await Product.findOne({
      _id: item.productId,
      stockOnHand: { $gte: item.quantity },
      version: { $exists: true },
    }).session(mongoSession);

    if (!product) {
      throw new CheckoutError(`Product ${item.name} is no longer available`, 409, 'STOCK_UNAVAILABLE');
    }

    const updated = await Product.findOneAndUpdate(
      { _id: item.productId, stockOnHand: { $gte: item.quantity }, version: product.version },
      { $inc: { stockOnHand: -item.quantity, version: 1 } },
      { session: mongoSession, new: true }
    );

    if (!updated) {
      throw new CheckoutError(
        `Product ${item.name} is no longer available (concurrent update)`,
        409,
        'STOCK_UNAVAILABLE'
      );
    }
  }
}

// Maps internal cart line items to the Order schema's lineItem shape.
function toOrderLineItems(lineItems) {
  return lineItems.map((item) => ({
    productId: item.productId,
    sku: item.sku,
    title: item.name,
    unitPrice: item.unitPrice.amount,
    currency: item.unitPrice.currency,
    quantity: item.quantity,
    lineTotal: item.lineTotal.amount,
  }));
}

// Builds the Order document shared by both payment flows. `status` differs per flow:
// 'pending_payment' for the redirect flow (confirmed later by webhook), 'pending' for sync.
function buildOrderDoc(session, status, idempotencyKey) {
  const {
    userId, contact, shippingAddress, shippingMethod, lineItems,
    subtotal, shippingCost, discount, total, currency,
  } = session;

  return {
    orderNumber: generateOrderNumber(),
    status,
    userId: userId || null,
    customerEmail: contact.email,
    customerName: contact.name,
    customerPhone: contact.phone,
    shippingAddress,
    shippingMethod: {
      name: shippingMethod.name,
      cost: shippingCost,
      currency: shippingMethod.currency,
    },
    lineItems: toOrderLineItems(lineItems),
    subtotal,
    shippingCost,
    discount: discount
      ? {
          code: discount.code,
          type: discount.type,
          value: discount.value,
          amountApplied: discount.amount,
          currency: discount.currency,
        }
      : null,
    total,
    currency,
    paymentStatus: 'pending',
    idempotencyKey: idempotencyKey || null,
  };
}

// Clears the cart and releases its reservations within a transaction.
async function clearCartAndReservations(cartId, mongoSession) {
  const cartDoc = await Cart.findById(cartId).session(mongoSession);
  if (cartDoc) {
    cartDoc.items = [];
    cartDoc.appliedPromoCode = null;
    cartDoc.markModified('items');
    cartDoc.markModified('appliedPromoCode');
    await cartDoc.save({ session: mongoSession });
  }
  await mongoose.model('Reservation').deleteMany({ cartId }).session(mongoSession);
}

// Emits one best-effort 'inventory.decremented' audit event per line item.
function emitInventoryDecrementedAudit(lineItems, orderId, requestId) {
  for (const item of lineItems) {
    createAuditEvent({
      actor: 'system',
      action: 'inventory.decremented',
      target: item.productId,
      targetType: 'Product',
      before: { quantity: item.quantity },
      after: { orderId: orderId.toString(), sku: item.sku, qtyDecremented: item.quantity },
      requestId,
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
  }
}

async function revalidatePromoCode({ promoCode, discount, subtotal, shippingCost, currency }) {
  if (!promoCode) return;
  try {
    const freshDiscount = await discountService.findBestDiscount({
      subtotal,
      shippingCost,
      currency,
      manualCode: promoCode,
    });
    if (!freshDiscount || freshDiscount.code !== discount?.code) {
      throw new CheckoutError('This promo code is no longer available', 409, 'PROMO_INVALID');
    }
  } catch (err) {
    if (err instanceof CheckoutError) throw err;
    throw new CheckoutError('This promo code is no longer available', 409, 'PROMO_INVALID');
  }
}

// REDIRECT FLOW — order is created as 'pending_payment' and confirmed later by webhook.
async function executeRedirectFlow({ session, provider, checkoutToken, paymentMethod, idempotencyKey, meta }) {
  const { cartId, userId, contact, lineItems, total, currency, promoCode, discount } = session;

  // Step 1: Atomic transaction — stock + promo + order (pending_payment) + payment tx + cart
  const mongoSession = await mongoose.startSession();
  let order = null;
  let paymentTransaction = null;

  try {
    await mongoSession.withTransaction(async () => {
      await decrementStockForItems(lineItems, mongoSession);
      if (promoCode && discount) {
        await discountService.incrementUsageCount(promoCode, mongoSession);
      }
      order = await Order.create([buildOrderDoc(session, 'pending_payment', idempotencyKey)], { session: mongoSession });
      order = order[0];
      paymentTransaction = await PaymentTransaction.create(
        [{ orderId: order._id, provider: paymentMethod, amount: total, currency, status: 'pending' }],
        { session: mongoSession }
      );
      paymentTransaction = paymentTransaction[0];
      await Order.findByIdAndUpdate(order._id, { paymentTransactionId: paymentTransaction._id }, { session: mongoSession });
      await clearCartAndReservations(cartId, mongoSession);
    });
  } catch (err) {
    if (err instanceof CheckoutError) throw err;
    if (err instanceof DiscountError) throw new CheckoutError(err.message, 409, err.code);
    logger.error({ err, checkoutToken }, 'Checkout transaction failed');
    throw new CheckoutError('Order creation failed. Please try again.', 500, 'ORDER_CREATION_FAILED');
  } finally {
    await mongoSession.endSession();
  }

  // Step 2: Create Paymob intention
  let intent;
  try {
    intent = await provider.createPaymentIntent({
      orderNumber: order.orderNumber,
      total,
      currency,
      customerEmail: contact.email,
      customerName: contact.name,
      customerPhone: contact.phone,
      lineItems: lineItems.map((item) => ({
        title: item.name,
        sku: item.sku,
        unitPrice: item.unitPrice.amount,
        quantity: item.quantity,
      })),
    });
  } catch (err) {
    logger.error({ err, orderId: order._id }, 'Paymob intention creation failed — compensating');
    await compensateFailedPayment({ order, lineItems, promoCode });
    throw new CheckoutError('Unable to initialize payment. Please try again.', 503, 'PAYMENT_INIT_FAILED');
  }

  // Step 3: Persist intentId (best-effort — a missing intentId is reconcilable via Paymob logs)
  try {
    await PaymentTransaction.findByIdAndUpdate(paymentTransaction._id, { intentId: intent.id });
  } catch (err) {
    logger.error({ err, orderId: order._id, intentId: intent.id }, 'Failed to store intentId on transaction');
  }

  if (meta.requestId) {
    createAuditEvent({
      actor: userId || 'guest',
      action: 'payment.intent_created',
      target: order._id.toString(),
      targetType: 'Order',
      before: { status: 'pending_payment' },
      after: { intentId: intent.id, provider: 'paymob', amount: total, currency },
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }).catch((err) => logger.error({ err }, 'Audit event failed'));
    emitInventoryDecrementedAudit(lineItems, order._id, meta.requestId);
  }

  await deleteCheckoutSession(checkoutToken);
  return { order, payUrl: intent.payUrl };
}

// SYNC FLOW — payment is confirmed inline; used by the stub provider and as a Paymob fallback.
async function executeSyncFlow({ session, provider, checkoutToken, paymentMethod, idempotencyKey, meta }) {
  const { cartId, userId, lineItems, total, currency, promoCode, discount } = session;

  // Step 1: Create payment intent (no charge yet)
  const intent = await provider.createPaymentIntent({
    orderNumber: 'pending',
    total,
    currency,
    customerEmail: session.contact.email,
  });

  // Step 2: Atomic transaction — stock + promo + order (pending) + cart
  const mongoSession = await mongoose.startSession();
  let order = null;

  try {
    await mongoSession.withTransaction(async () => {
      await decrementStockForItems(lineItems, mongoSession);
      if (promoCode && discount) {
        await discountService.incrementUsageCount(promoCode, mongoSession);
      }
      order = await Order.create([buildOrderDoc(session, 'pending', idempotencyKey)], { session: mongoSession });
      order = order[0];
      await clearCartAndReservations(cartId, mongoSession);
    });
  } catch (err) {
    if (err instanceof CheckoutError) throw err;
    if (err instanceof DiscountError) throw new CheckoutError(err.message, 409, err.code);
    logger.error({ err, checkoutToken }, 'Checkout transaction failed');
    throw new CheckoutError('Order creation failed. Please try again.', 500, 'ORDER_CREATION_FAILED');
  } finally {
    await mongoSession.endSession();
  }

  // Step 3: Confirm payment — if this fails we compensate and surface the error
  const paymentResult = await provider.confirmPayment(intent.id);

  if (!paymentResult.success) {
    if (meta.requestId) {
      createAuditEvent({
        actor: userId || 'guest',
        action: 'order.payment_failed',
        target: order._id.toString(),
        targetType: 'Order',
        before: { total, currency },
        after: { errorCode: paymentResult.errorCode, errorMessage: paymentResult.errorMessage },
        requestId: meta.requestId,
        ip: meta.ip,
        userAgent: meta.userAgent,
      }).catch((err) => logger.error({ err }, 'Audit event failed'));
    }
    await compensateFailedPayment({ order, lineItems, promoCode });
    throw new CheckoutError(
      paymentResult.errorMessage || 'Payment failed',
      402,
      paymentResult.errorCode || 'PAYMENT_FAILED'
    );
  }

  // Step 4: Record payment transaction + confirm order
  const confirmSession = await mongoose.startSession();
  let paymentTransaction = null;
  try {
    await confirmSession.withTransaction(async () => {
      paymentTransaction = await PaymentTransaction.create(
        [
          {
            orderId: order._id,
            provider: paymentMethod,
            providerTransactionId: paymentResult.transactionId,
            intentId: intent.id,
            amount: total,
            currency,
            status: 'succeeded',
          },
        ],
        { session: confirmSession }
      );
      paymentTransaction = paymentTransaction[0];
      await Order.findByIdAndUpdate(
        order._id,
        { status: 'confirmed', paymentStatus: 'succeeded', paymentTransactionId: paymentTransaction._id },
        { session: confirmSession }
      );
    });
  } catch (err) {
    logger.error({ err, orderId: order._id }, 'Failed to confirm order after payment — manual intervention required');
    throw new CheckoutError('Order confirmation failed. Please contact support.', 500, 'ORDER_CONFIRMATION_FAILED');
  } finally {
    await confirmSession.endSession();
  }

  await deleteCheckoutSession(checkoutToken);

  if (meta.requestId) {
    createAuditEvent({
      actor: userId || 'guest',
      action: 'order.created',
      target: order._id.toString(),
      targetType: 'Order',
      before: { status: 'pending' },
      after: { status: 'confirmed', orderNumber: order.orderNumber, total, currency },
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }).catch((err) => logger.error({ err }, 'Audit event failed'));

    createAuditEvent({
      actor: userId || 'guest',
      action: 'order.payment_confirmed',
      target: order._id.toString(),
      targetType: 'Order',
      before: { paymentStatus: 'pending' },
      after: { paymentStatus: 'succeeded', transactionId: paymentResult.transactionId },
      requestId: meta.requestId,
      ip: meta.ip,
      userAgent: meta.userAgent,
    }).catch((err) => logger.error({ err }, 'Audit event failed'));

    emitInventoryDecrementedAudit(lineItems, order._id, meta.requestId);
  }

  return order;
}

async function processOrder({ checkoutToken, paymentMethod = 'stub', idempotencyKey, meta = {} }) {
  const session = await getCheckoutSession(checkoutToken);
  if (!session) {
    throw new CheckoutError('Checkout session expired or invalid', 400, 'INVALID_CHECKOUT_TOKEN');
  }

  const { cartId, userId, subtotal, shippingCost, originalShippingCost, discount, currency, promoCode } = session;

  await validateCheckout({ cartId, userId });
  await revalidatePromoCode({ promoCode, discount, subtotal, shippingCost: originalShippingCost || shippingCost, currency });

  const provider = createPaymentProvider();
  // Branch on provider capability, not name — a new provider needs no change here.
  // paymob_enabled flag can force the sync flow even when the provider supports redirects.
  const paymobFeatureEnabled = await isEnabled('paymob_enabled');
  const useRedirectFlow = provider.mode === 'redirect' && paymobFeatureEnabled !== false;

  if (useRedirectFlow) {
    return executeRedirectFlow({ session, provider, checkoutToken, paymentMethod, idempotencyKey, meta });
  }
  return executeSyncFlow({ session, provider, checkoutToken, paymentMethod, idempotencyKey, meta });
}

module.exports = {
  validateCheckout,
  createCheckoutSession,
  processOrder,
  CheckoutError,
};
