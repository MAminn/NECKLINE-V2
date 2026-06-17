jest.mock('axios');

const axios = require('axios');
const PaymobPaymentProvider = require('../../../src/services/payment/PaymobPaymentProvider');
const env = require('../../../src/config/env');

describe('PaymobPaymentProvider', () => {
  const originalApiKey = env.PAYMOB_API_KEY;
  const originalIntegrationId = env.PAYMOB_INTEGRATION_ID;

  beforeEach(() => {
    jest.resetAllMocks();
    env.PAYMOB_API_KEY = 'skl_test_valid_key_12345';
    env.PAYMOB_INTEGRATION_ID = '123456';
  });

  afterAll(() => {
    env.PAYMOB_API_KEY = originalApiKey;
    env.PAYMOB_INTEGRATION_ID = originalIntegrationId;
  });

  describe('construction', () => {
    it('throws when PAYMOB_API_KEY is missing, regardless of environment', () => {
      env.PAYMOB_API_KEY = '';
      expect(() => new PaymobPaymentProvider()).toThrow('requires a valid PAYMOB_API_KEY');
    });

    it('throws when PAYMOB_API_KEY is too short', () => {
      env.PAYMOB_API_KEY = 'short';
      expect(() => new PaymobPaymentProvider()).toThrow('requires a valid PAYMOB_API_KEY');
    });

    it('constructs successfully with a valid API key', () => {
      expect(() => new PaymobPaymentProvider()).not.toThrow();
    });
  });

  describe('createPaymentIntent', () => {
    it('throws on invalid order total', async () => {
      const provider = new PaymobPaymentProvider();
      await expect(
        provider.createPaymentIntent({ orderNumber: 'TEST-002', total: 0 })
      ).rejects.toThrow('Invalid order');
    });

    it('throws on missing orderNumber', async () => {
      const provider = new PaymobPaymentProvider();
      await expect(
        provider.createPaymentIntent({ total: 1000 })
      ).rejects.toThrow('Invalid order');
    });

    it('calls the real Paymob intention API and returns id/clientSecret/payUrl', async () => {
      axios.post.mockResolvedValue({
        data: { id: 'intent_123', client_secret: 'cs_live_abc' },
      });

      const provider = new PaymobPaymentProvider();
      const result = await provider.createPaymentIntent({
        orderNumber: 'TEST-001',
        total: 10000,
        currency: 'EGP',
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        customerPhone: '01012345678',
        lineItems: [{ title: 'Product A', sku: 'SKU001', unitPrice: 5000, quantity: 2 }],
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/intention'),
        expect.objectContaining({ amount: '100.00', currency: 'EGP' }),
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Token skl_test_valid_key_12345' }) })
      );
      expect(result.id).toBe('intent_123');
      expect(result.status).toBe('requires_confirmation');
      expect(result.clientSecret).toBe('cs_live_abc');
      expect(result.payUrl).toContain('clientSecret=cs_live_abc');
      expect(result.amount).toBe(10000);
      expect(result.currency).toBe('EGP');
    });

    it('throws when the Paymob API call fails', async () => {
      axios.post.mockRejectedValue(new Error('network error'));
      const provider = new PaymobPaymentProvider();

      await expect(
        provider.createPaymentIntent({ orderNumber: 'TEST-003', total: 10000 })
      ).rejects.toThrow('Paymob intention creation failed');
    });
  });

  describe('confirmPayment', () => {
    it('reports success when the intention is paid', async () => {
      axios.get.mockResolvedValue({
        data: { status: 'paid', amount: '50.00', currency: 'EGP', transactions: [{ id: 'txn_1' }] },
      });

      const provider = new PaymobPaymentProvider();
      const result = await provider.confirmPayment('intent_123');

      expect(result.success).toBe(true);
      expect(result.status).toBe('succeeded');
      expect(result.transactionId).toBe('txn_1');
      expect(result.amount).toBe(5000);
    });

    it('reports failure when the intention is not yet paid', async () => {
      axios.get.mockResolvedValue({ data: { status: 'pending' } });

      const provider = new PaymobPaymentProvider();
      const result = await provider.confirmPayment('intent_123');

      expect(result.success).toBe(false);
      expect(result.status).toBe('pending');
    });

    it('reports failure when the Paymob API call errors', async () => {
      axios.get.mockRejectedValue(new Error('timeout'));
      const provider = new PaymobPaymentProvider();

      const result = await provider.confirmPayment('intent_123');

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
      expect(result.errorCode).toBe('paymob_confirm_error');
    });
  });

  describe('refund', () => {
    it('calls the real Paymob refund API', async () => {
      axios.post.mockResolvedValue({ data: { id: 'refund_123' } });

      const provider = new PaymobPaymentProvider();
      const result = await provider.refund('paymob_txn_123', 5000);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/v1/transaction/refund'),
        expect.objectContaining({ transaction_id: 'paymob_txn_123', amount_cents: 5000 }),
        expect.any(Object)
      );
      expect(result.success).toBe(true);
      expect(result.refundId).toBe('refund_123');
      expect(result.amount).toBe(5000);
    });

    it('reports failure when the Paymob refund API errors', async () => {
      axios.post.mockRejectedValue(new Error('declined'));
      const provider = new PaymobPaymentProvider();

      const result = await provider.refund('paymob_txn_123', 5000);

      expect(result.success).toBe(false);
      expect(result.status).toBe('failed');
    });
  });
});
