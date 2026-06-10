const request = require('supertest');
const express = require('express');
const webhookRouter = require('../../../src/routes/v1/webhooks');

// Mock dependencies
jest.mock('../../../src/models/Order');
jest.mock('../../../src/models/PaymentTransaction');
jest.mock('../../../src/services/orderService');
jest.mock('../../../src/domain/audit');
jest.mock('../../../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const mongoose = require('mongoose');

// Helper: build a query mock whose .lean() resolves to `value` (matches `.findOne(...).lean()`).
const leanResolving = (value) => ({ lean: () => Promise.resolve(value) });

const Order = require('../../../src/models/Order');
const PaymentTransaction = require('../../../src/models/PaymentTransaction');
const orderService = require('../../../src/services/orderService');
const { createAuditEvent } = require('../../../src/domain/audit');

describe('POST /webhooks/paymob', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/webhooks/paymob', webhookRouter);
    jest.clearAllMocks();

    // Stub the Mongoose session so withTransaction runs its callback without a real DB.
    jest.spyOn(mongoose, 'startSession').mockResolvedValue({
      withTransaction: async (fn) => fn(),
      endSession: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('returns 400 for missing intent_id', async () => {
    const res = await request(app)
      .post('/webhooks/paymob')
      .send({ type: 'transaction', data: {} });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(true);
  });

  it('returns 200 for duplicate already-processed transaction', async () => {
    PaymentTransaction.findOne.mockReturnValue(leanResolving({ status: 'succeeded', providerTransactionId: 'txn_123' }));

    const res = await request(app)
      .post('/webhooks/paymob')
      .send({
        type: 'transaction',
        data: { intention_id: 'int_123', transaction_id: 'txn_123', amount: 10000 },
      });

    expect(res.status).toBe(200);
    expect(res.body.duplicate).toBe(true);
  });

  it('returns 404 when order not found', async () => {
    PaymentTransaction.findOne.mockReturnValue(leanResolving(null));
    orderService.getOrderByIntentId.mockResolvedValue(null);

    const res = await request(app)
      .post('/webhooks/paymob')
      .send({
        type: 'transaction',
        data: { intention_id: 'int_123', transaction_id: 'txn_123', amount: 10000 },
      });

    expect(res.status).toBe(404);
  });

  it('returns 400 when amount mismatches', async () => {
    PaymentTransaction.findOne.mockReturnValue(leanResolving(null));
    orderService.getOrderByIntentId.mockResolvedValue({
      _id: 'order123',
      total: 5000,
      status: 'pending_payment',
      paymentStatus: 'pending',
    });

    const res = await request(app)
      .post('/webhooks/paymob')
      .send({
        type: 'transaction',
        data: { intention_id: 'int_123', transaction_id: 'txn_123', amount: 10000 },
      });

    expect(res.status).toBe(400);
  });

  it.each([
    ['decimal string', '100.50'],
    ['trailing garbage', '10000abc'],
    ['non-numeric', 'abc'],
    ['negative', '-10000'],
    ['zero', 0],
    ['non-integer number', 100.5],
    ['missing', undefined],
  ])('returns 400 for malformed amount (%s)', async (_label, amount) => {
    PaymentTransaction.findOne.mockReturnValue(leanResolving(null));
    orderService.getOrderByIntentId.mockResolvedValue({
      _id: 'order123',
      total: 10000,
      status: 'pending_payment',
      paymentStatus: 'pending',
    });

    const res = await request(app)
      .post('/webhooks/paymob')
      .send({
        type: 'transaction',
        data: { intention_id: 'int_123', transaction_id: 'txn_123', amount },
      });

    expect(res.status).toBe(400);
    expect(PaymentTransaction.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('confirms order on valid webhook', async () => {
    PaymentTransaction.findOne.mockReturnValue(leanResolving(null));
    orderService.getOrderByIntentId.mockResolvedValue({
      _id: 'order123',
      orderNumber: 'ORD-001',
      total: 10000,
      status: 'pending_payment',
      paymentStatus: 'pending',
    });

    PaymentTransaction.findOneAndUpdate.mockResolvedValue({});
    Order.findByIdAndUpdate.mockResolvedValue({});
    createAuditEvent.mockResolvedValue({});

    const res = await request(app)
      .post('/webhooks/paymob')
      .send({
        type: 'transaction',
        data: { intention_id: 'int_123', transaction_id: 'txn_123', amount: 10000, currency: 'EGP' },
      });

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    expect(PaymentTransaction.findOneAndUpdate).toHaveBeenCalled();
    expect(Order.findByIdAndUpdate).toHaveBeenCalled();
  });
});
