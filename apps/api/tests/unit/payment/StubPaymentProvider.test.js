const StubPaymentProvider = require('../../../src/services/payment/StubPaymentProvider');

describe('StubPaymentProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new StubPaymentProvider();
    // Override latency for fast tests
    provider.latencyMs = 0;
    provider.failureRate = 0;
    provider.declineEmails.clear();
  });

  describe('createPaymentIntent', () => {
    it('creates an intent with requires_confirmation status', async () => {
      const intent = await provider.createPaymentIntent({
        orderNumber: 'TEST-001',
        total: 10000,
        currency: 'EGP',
        customerEmail: 'test@example.com',
      });

      expect(intent.id).toMatch(/^stub_intent_/);
      expect(intent.status).toBe('requires_confirmation');
      expect(intent.amount).toBe(10000);
      expect(intent.currency).toBe('EGP');
    });

    it('throws on invalid order total', async () => {
      await expect(
        provider.createPaymentIntent({ total: 0, currency: 'EGP', customerEmail: 'test@example.com' })
      ).rejects.toThrow('Invalid order total');
    });
  });

  describe('confirmPayment', () => {
    it('succeeds for valid intent', async () => {
      const intent = await provider.createPaymentIntent({
        orderNumber: 'TEST-001',
        total: 10000,
        currency: 'EGP',
        customerEmail: 'test@example.com',
      });

      const result = await provider.confirmPayment(intent.id);

      expect(result.success).toBe(true);
      expect(result.status).toBe('succeeded');
      expect(result.transactionId).toMatch(/^stub_txn_/);
    });

    it('fails for unknown intent', async () => {
      const result = await provider.confirmPayment('stub_intent_unknown');

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('stub_invalid_intent');
    });

    it('fails for deterministic test hook (_fail suffix)', async () => {
      const intent = await provider.createPaymentIntent({
        orderNumber: 'TEST-001',
        total: 10000,
        currency: 'EGP',
        customerEmail: 'test@example.com',
      });

      // Manually set intent ID to end with _fail
      provider.intents.delete(intent.id);
      const failId = 'stub_intent_12345_fail';
      provider.intents.set(failId, { ...intent, id: failId });

      const result = await provider.confirmPayment(failId);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('stub_decline');
    });

    it('fails for declined email', async () => {
      provider.declineEmails.add('declined@example.com');

      const intent = await provider.createPaymentIntent({
        orderNumber: 'TEST-001',
        total: 10000,
        currency: 'EGP',
        customerEmail: 'declined@example.com',
      });

      const result = await provider.confirmPayment(intent.id);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('stub_decline');
    });

    it('fails randomly when failureRate is set', async () => {
      provider.failureRate = 1.0; // 100% failure

      const intent = await provider.createPaymentIntent({
        orderNumber: 'TEST-001',
        total: 10000,
        currency: 'EGP',
        customerEmail: 'test@example.com',
      });

      const result = await provider.confirmPayment(intent.id);

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('stub_decline');
    });
  });

  describe('refund', () => {
    it('returns success for any transaction', async () => {
      const result = await provider.refund('stub_txn_123', 5000);

      expect(result.success).toBe(true);
      expect(result.refundId).toMatch(/^stub_refund_/);
      expect(result.amount).toBe(5000);
    });
  });
});
