const { Router } = require('express');
const mongoose = require('mongoose');
const Order = require('../../models/Order');
const PaymentTransaction = require('../../models/PaymentTransaction');
const orderService = require('../../services/orderService');
const { createAuditEvent } = require('../../domain/audit');
const logger = require('../../config/logger');

const router = Router();

/**
 * POST /api/v1/webhooks/paymob
 * Receives Paymob payment confirmation webhooks.
 * Idempotent: duplicate transaction_ids are silently accepted (200) but not re-processed.
 */
router.post('/', async (req, res) => {
  const payload = req.body;

  // Paymob webhook payload shape (may vary by event type)
  // Expected: { type, data: { intention_id, transaction_id, amount, currency, status, ... } }
  const intentId =
    payload.data?.intention_id ||
    payload.data?.payment_key_claims?.intent_id ||
    payload.intention_id ||
    payload.obj?.id;

  const transactionId =
    payload.data?.transaction_id ||
    payload.data?.id ||
    payload.obj?.id;

  const amountCents =
    payload.data?.amount ||
    payload.data?.amount_cents ||
    payload.obj?.amount_cents;

  const status = payload.data?.status || payload.obj?.success;

  if (!intentId || !transactionId) {
    logger.warn({ payloadKeys: Object.keys(payload) }, 'Paymob webhook: missing intent_id or transaction_id');
    return res.status(400).json({ error: true, message: 'Missing intent_id or transaction_id' });
  }

  logger.info(
    { intentId, transactionId, amountCents, status },
    'Paymob webhook received'
  );

  try {
    // 1. Deduplicate: check if this transaction was already processed
    const existingTransaction = await PaymentTransaction.findOne({
      providerTransactionId: String(transactionId),
    }).lean();

    if (existingTransaction && existingTransaction.status === 'succeeded') {
      logger.info({ transactionId }, 'Paymob webhook: duplicate transaction — already processed');
      return res.status(200).json({ received: true, duplicate: true });
    }

    // 2. Find order by intentId
    const order = await orderService.getOrderByIntentId(String(intentId));
    if (!order) {
      logger.warn({ intentId }, 'Paymob webhook: order not found for intentId');
      return res.status(404).json({ error: true, message: 'Order not found' });
    }

    // 3. Verify amount: must be a positive integer exactly equal to order.total.
    // A missing/zero/NaN amount is a hard failure — never confirm an order
    // without a verified amount.
    const webhookAmount = typeof amountCents === 'number'
      ? amountCents
      : (typeof amountCents === 'string' && /^\d+$/.test(amountCents))
        ? parseInt(amountCents, 10)
        : NaN;
    if (!Number.isInteger(webhookAmount) || webhookAmount <= 0) {
      logger.error(
        { orderId: order._id, expected: order.total, received: amountCents },
        'Paymob webhook: missing or invalid amount'
      );
      return res.status(400).json({ error: true, message: 'Missing or invalid amount' });
    }

    if (webhookAmount !== order.total) {
      logger.error(
        { orderId: order._id, expected: order.total, received: webhookAmount },
        'Paymob webhook: amount mismatch'
      );
      return res.status(400).json({ error: true, message: 'Amount mismatch' });
    }

    // 4. Atomic transaction: confirm order + update payment transaction
    const mongoSession = await mongoose.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        // Update PaymentTransaction
        await PaymentTransaction.findOneAndUpdate(
          { orderId: order._id },
          {
            providerTransactionId: String(transactionId),
            status: 'succeeded',
          },
          { session: mongoSession, upsert: false }
        );

        // Update Order to confirmed
        await Order.findByIdAndUpdate(
          order._id,
          {
            status: 'confirmed',
            paymentStatus: 'succeeded',
          },
          { session: mongoSession }
        );
      });
    } finally {
      await mongoSession.endSession();
    }

    // 5. Audit event
    createAuditEvent({
      actor: 'system',
      action: 'payment.webhook_confirmed',
      target: order._id.toString(),
      targetType: 'Order',
      before: { status: order.status, paymentStatus: order.paymentStatus },
      after: { status: 'confirmed', paymentStatus: 'succeeded', transactionId },
      requestId: req.id,
      ip: req.ip,
    }).catch((err) => logger.error({ err }, 'Audit event failed'));

    logger.info(
      { orderId: order._id, orderNumber: order.orderNumber, transactionId },
      'Paymob webhook: order confirmed'
    );

    return res.status(200).json({ received: true, orderNumber: order.orderNumber });
  } catch (err) {
    logger.error({ err, intentId, transactionId }, 'Paymob webhook processing failed');
    return res.status(500).json({ error: true, message: 'Webhook processing failed' });
  }
});

module.exports = router;
