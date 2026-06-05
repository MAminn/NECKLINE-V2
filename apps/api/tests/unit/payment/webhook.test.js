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
  });

  it('returns 400 for missing intent_id', async () => {
    const res = await request(app)
      .post('/webhooks/paymob')
      .send({ type: 'transaction', data: {} });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(true);
  });

  it('returns 200 for duplicate already-processed transaction', async () => {
    PaymentTransaction.findOne.mockResolvedValue({ status: 'succeeded', providerTransactionId: 'txn_123' });

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
    PaymentTransaction.findOne.mockResolvedValue(null);
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
    PaymentTransaction.findOne.mockResolvedValue(null);
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

  it('confirms order on valid webhook', async () => {
    PaymentTransaction.findOne.mockResolvedValue(null);
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
