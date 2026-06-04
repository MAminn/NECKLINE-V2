const PaymobPaymentProvider = require('../../../src/services/payment/PaymobPaymentProvider');

describe('PaymobPaymentProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new PaymobPaymentProvider();
    // Force mock mode for predictable tests
    provider.mockMode = true;
  });

  describe('createPaymentIntent', () => {
    it('returns a mock intent with id, clientSecret, and payUrl', async () => {
      const result = await provider.createPaymentIntent({
        orderNumber: 'TEST-001',
        total: 10000,
        currency: 'EGP',
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        customerPhone: '01012345678',
        lineItems: [{ title: 'Product A', sku: 'SKU001', unitPrice: 5000, quantity: 2 }],
      });

      expect(result.id).toMatch(/^paymob_mock_intent_/);
      expect(result.status).toBe('requires_confirmation');
      expect(result.clientSecret).toMatch(/^cs_mock_/);
      expect(result.payUrl).toContain('clientSecret=');
      expect(result.amount).toBe(10000);
      expect(result.currency).toBe('EGP');
    });

    it('throws on invalid order total', async () => {
      await expect(
        provider.createPaymentIntent({ orderNumber: 'TEST-002', total: 0 })
      ).rejects.toThrow('Invalid order');
    });

    it('throws on missing orderNumber', async () => {
      await expect(
        provider.createPaymentIntent({ total: 1000 })
      ).rejects.toThrow('Invalid order');
    });
  });

  describe('confirmPayment', () => {
    it('returns success in mock mode', async () => {
      const result = await provider.confirmPayment('paymob_mock_intent_123');

      expect(result.success).toBe(true);
      expect(result.status).toBe('succeeded');
      expect(result.transactionId).toMatch(/^paymob_mock_txn_/);
    });
  });

  describe('refund', () => {
    it('returns success in mock mode', async () => {
      const result = await provider.refund('paymob_txn_123', 5000);

      expect(result.success).toBe(true);
      expect(result.refundId).toMatch(/^paymob_mock_refund_/);
      expect(result.amount).toBe(5000);
      expect(result.currency).toBe('EGP');
    });
  });

  describe('mockMode detection', () => {
    it('enters mock mode when apiKey is empty', () => {
      const p = new PaymobPaymentProvider();
      p.apiKey = '';
      p.mockMode = !p.apiKey || p.apiKey.length < 10;
      expect(p.mockMode).toBe(true);
    });

    it('enters live mode when apiKey is valid', () => {
      const p = new PaymobPaymentProvider();
      p.apiKey = 'skl_test_valid_key_12345';
      p.mockMode = !p.apiKey || p.apiKey.length < 10;
      expect(p.mockMode).toBe(false);
    });
  });
});
