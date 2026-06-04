const mongoose = require('mongoose');
const crypto = require('crypto');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const PaymentTransaction = require('../models/PaymentTransaction');
const PromoCode = require('../models/PromoCode');
const { createPaymentProvider } = require('./payment/PaymentProviderFactory');
const env = require('../config/env');
const { isEnabled } = require('../domain/features');
const { generateOrderNumber } = require('../utils/generateOrderNumber');
const { getDefaultShippingMethod } = require('./shippingService');
const cartService = require('./cartService');
const discountService = require('./discountService');
const { DiscountError } = require('./discountService');
const { createAuditEvent } = require('../domain/audit');
const logger = require('../config/logger');

// In-memory checkout sessions with TTL (15 minutes)
const checkoutSessions = new Map();
const CHECKOUT_SESSION_TTL_MS = 15 * 60 * 1000;

function createCheckoutToken() {
  return `cko_${crypto.randomBytes(16).toString('hex')}`;
}

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of checkoutSessions) {
    if (now - session.createdAt > CHECKOUT_SESSION_TTL_MS) {
      checkoutSessions.delete(token);
    }
  }
}

class CheckoutError extends Error {
  constructor(message, statusCode = 400, code = 'CHECKOUT_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

async function validateCheckout({ cartId, userId }) {
  cleanupExpiredSessions();

  const cart = await cartService.getCart(cartId, userId);
  if (!cart || !cart.items || cart.items.length === 0) {
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
  checkoutSessions.set(token, {
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
    createdAt: Date.now(),
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

async function compensateFailedPayment({ order, lineItems, promoCode }) {
  const mongoSession = await mongoose.startSession();
  try {
    await mongoSession.withTransaction(async () => {
      await Order.findByIdAndUpdate(order._id, { paymentStatus: 'failed' }, { session: mongoSession });
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
  } finally {
    await mongoSession.endSession();
  }
}

async function processOrder({ checkoutToken, paymentMethod = 'stub', idempotencyKey, meta = {} }) {
  cleanupExpiredSessions();

  const session = checkoutSessions.get(checkoutToken);
  if (!session) {
    throw new CheckoutError('Checkout session expired or invalid', 400, 'INVALID_CHECKOUT_TOKEN');
  }

  const {
    cartId,
    userId,
    contact,
    shippingAddress,
    shippingMethod,
    lineItems,
    subtotal,
    shippingCost,
    originalShippingCost,
    discount,
    total,
    currency,
    promoCode,
  } = session;

  // Re-validate stock before processing
  const cart = await cartService.getCart(cartId, userId);
  if (!cart || !cart.items || cart.items.length === 0) {
    throw new CheckoutError('Cart is empty', 400, 'EMPTY_CART');
  }

  const unavailableItems = cart.items.filter((item) => !item.available);
  if (unavailableItems.length > 0) {
    const names = unavailableItems.map((i) => i.name).join(', ');
    throw new CheckoutError(`The following items are no longer available: ${names}`, 409, 'STOCK_UNAVAILABLE');
  }

  // Re-validate discount before payment
  if (promoCode) {
    try {
      const freshDiscount = await discountService.findBestDiscount({
        subtotal,
        shippingCost: originalShippingCost || shippingCost,
        currency,
        manualCode: promoCode,
      });
      if (!freshDiscount || freshDiscount.code !== discount?.code) {
        throw new CheckoutError(
          'This promo code is no longer available',
          409,
          'PROMO_INVALID'
        );
      }
    } catch (err) {
      if (err instanceof CheckoutError) throw err;
      throw new CheckoutError(
        'This promo code is no longer available',
        409,
        'PROMO_INVALID'
      );
    }
  }

  const provider = createPaymentProvider();
  const paymobFeatureEnabled = await isEnabled('paymob_enabled');
  const isPaymob = env.PAYMENT_PROVIDER === 'paymob' && paymobFeatureEnabled !== false;

  // ─────────────────────────────────────────────────────────────
  // PAYMOB FLOW (async redirect + webhook)
  // ─────────────────────────────────────────────────────────────
  if (isPaymob) {
    // Step 1: Atomic transaction — stock decrement + promo + order (pending_payment) + transaction + cart clear
    const mongoSession = await mongoose.startSession();
    let order = null;
    let paymentTransaction = null;

    try {
      await mongoSession.withTransaction(async () => {
        // 1a. Decrement stock with optimistic locking
        for (const item of lineItems) {
          const product = await Product.findOne({
            _id: item.productId,
            stockOnHand: { $gte: item.quantity },
            version: { $exists: true },
          }).session(mongoSession);

          if (!product) {
            throw new CheckoutError(
              `Product ${item.name} is no longer available`,
              409,
              'STOCK_UNAVAILABLE'
            );
          }

          const updated = await Product.findOneAndUpdate(
            {
              _id: item.productId,
              stockOnHand: { $gte: item.quantity },
              version: product.version,
            },
            {
              $inc: { stockOnHand: -item.quantity, version: 1 },
            },
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

        // 1b. Increment promo code usage count (if applicable)
        if (promoCode && discount) {
          await discountService.incrementUsageCount(promoCode, mongoSession);
        }

        // 1c. Create order with status 'pending_payment' — confirmed by webhook later
        const orderNumber = generateOrderNumber();
        order = await Order.create(
          [
            {
              orderNumber,
              status: 'pending_payment',
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
              lineItems: lineItems.map((item) => ({
                productId: item.productId,
                sku: item.sku,
                title: item.name,
                unitPrice: item.unitPrice.amount,
                currency: item.unitPrice.currency,
                quantity: item.quantity,
                lineTotal: item.lineTotal.amount,
              })),
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
            },
          ],
          { session: mongoSession }
        );
        order = order[0];

        // 1d. Create pending PaymentTransaction
        paymentTransaction = await PaymentTransaction.create(
          [
            {
              orderId: order._id,
              provider: paymentMethod,
              amount: total,
              currency,
              status: 'pending',
            },
          ],
          { session: mongoSession }
        );
        paymentTransaction = paymentTransaction[0];

        // 1e. Link transaction to order
        await Order.findByIdAndUpdate(
          order._id,
          { paymentTransactionId: paymentTransaction._id },
          { session: mongoSession }
        );

        // 1f. Clear cart
        const cartDoc = await Cart.findById(cartId).session(mongoSession);
        if (cartDoc) {
          cartDoc.items = [];
          cartDoc.appliedPromoCode = null;
          cartDoc.markModified('items');
          cartDoc.markModified('appliedPromoCode');
          await cartDoc.save({ session: mongoSession });
        }

        // 1g. Release reservations
        await mongoose.model('Reservation').deleteMany({ cartId }).session(mongoSession);
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
      // Compensate: restore stock, delete order, decrement promo usage
      await compensateFailedPayment({ order, lineItems, promoCode });
      throw new CheckoutError(
        'Unable to initialize payment. Please try again.',
        503,
        'PAYMENT_INIT_FAILED'
      );
    }

    // Step 3: Update PaymentTransaction with intentId
    try {
      await PaymentTransaction.findByIdAndUpdate(paymentTransaction._id, {
        intentId: intent.id,
      });
    } catch (err) {
      logger.error({ err, orderId: order._id, intentId: intent.id }, 'Failed to store intentId on transaction');
    }

    // Audit: payment intent created
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

      // Audit: inventory decremented
      for (const item of lineItems) {
        createAuditEvent({
          actor: 'system',
          action: 'inventory.decremented',
          target: item.productId,
          targetType: 'Product',
          before: { quantity: item.quantity },
          after: { orderId: order._id.toString(), sku: item.sku, qtyDecremented: item.quantity },
          requestId: meta.requestId,
        }).catch((err) => logger.error({ err }, 'Audit event failed'));
      }
    }

    // Remove checkout session
    checkoutSessions.delete(checkoutToken);

    // Return order + payUrl for frontend redirect
    return { order, payUrl: intent.payUrl };
  }

  // ─────────────────────────────────────────────────────────────
  // STUB FLOW (synchronous inline confirmation — existing behavior)
  // ─────────────────────────────────────────────────────────────

  // Step 1: Create payment intent (no charge yet)
  const intent = await provider.createPaymentIntent({
    orderNumber: 'pending',
    total,
    currency,
    customerEmail: contact.email,
  });

  // Step 2: Atomic transaction — stock decrement + promo + order (pending) + cart clear
  const mongoSession = await mongoose.startSession();
  let order = null;

  try {
    await mongoSession.withTransaction(async () => {
      // 2a. Decrement stock with optimistic locking
      for (const item of lineItems) {
        const product = await Product.findOne({
          _id: item.productId,
          stockOnHand: { $gte: item.quantity },
          version: { $exists: true },
        }).session(mongoSession);

        if (!product) {
          throw new CheckoutError(
            `Product ${item.name} is no longer available`,
            409,
            'STOCK_UNAVAILABLE'
          );
        }

        const updated = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            stockOnHand: { $gte: item.quantity },
            version: product.version,
          },
          {
            $inc: { stockOnHand: -item.quantity, version: 1 },
          },
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

      // 2b. Increment promo code usage count (if applicable)
      if (promoCode && discount) {
        await discountService.incrementUsageCount(promoCode, mongoSession);
      }

      // 2c. Create order with paymentStatus 'pending' — confirmed after payment succeeds
      const orderNumber = generateOrderNumber();
      order = await Order.create(
        [
          {
            orderNumber,
            status: 'pending',
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
            lineItems: lineItems.map((item) => ({
              productId: item.productId,
              sku: item.sku,
              title: item.name,
              unitPrice: item.unitPrice.amount,
              currency: item.unitPrice.currency,
              quantity: item.quantity,
              lineTotal: item.lineTotal.amount,
            })),
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
          },
        ],
        { session: mongoSession }
      );
      order = order[0];

      // 2d. Clear cart
      const cartDoc = await Cart.findById(cartId).session(mongoSession);
      if (cartDoc) {
        cartDoc.items = [];
        cartDoc.appliedPromoCode = null;
        cartDoc.markModified('items');
        cartDoc.markModified('appliedPromoCode');
        await cartDoc.save({ session: mongoSession });
      }

      // 2e. Release reservations
      await mongoose.model('Reservation').deleteMany({ cartId }).session(mongoSession);
    });
  } catch (err) {
    if (err instanceof CheckoutError) throw err;
    if (err instanceof DiscountError) throw new CheckoutError(err.message, 409, err.code);
    logger.error({ err, checkoutToken }, 'Checkout transaction failed');
    throw new CheckoutError('Order creation failed. Please try again.', 500, 'ORDER_CREATION_FAILED');
  } finally {
    await mongoSession.endSession();
  }

  // Step 3: Confirm payment — order exists in DB but is pending; if this fails we compensate
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

  // Step 4: Record payment + confirm order
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

  // Remove checkout session
  checkoutSessions.delete(checkoutToken);

  // Audit: order created
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

    // Audit: inventory decremented
    for (const item of lineItems) {
      createAuditEvent({
        actor: 'system',
        action: 'inventory.decremented',
        target: item.productId,
        targetType: 'Product',
        before: { quantity: item.quantity },
        after: { orderId: order._id.toString(), sku: item.sku, qtyDecremented: item.quantity },
        requestId: meta.requestId,
      }).catch((err) => logger.error({ err }, 'Audit event failed'));
    }
  }

  return order;
}

module.exports = {
  validateCheckout,
  createCheckoutSession,
  processOrder,
  CheckoutError,
};
