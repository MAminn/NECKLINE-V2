const PaymentProvider = require('./PaymentProvider');
const env = require('../../config/env');
const logger = require('../../config/logger');

// PaymobPaymentProvider — integrates with Paymob's Intention API (v2)
// Uses direct REST calls via axios (paymob-node is not published to npm).
// When credentials are missing, falls back to mock responses for development/testing.

let axios;
try {
  axios = require('axios');
} catch {
  // If axios is not available, mock mode only
  axios = null;
}

class PaymobPaymentProvider extends PaymentProvider {
  constructor() {
    super();
    this.apiKey = env.PAYMOB_API_KEY;
    this.integrationId = env.PAYMOB_INTEGRATION_ID;
    this.iframeId = env.PAYMOB_IFRAME_ID;
    this.hmacSecret = env.PAYMOB_HMAC_SECRET;
    this.baseUrl = env.PAYMOB_BASE_URL || 'https://accept.paymob.com';
    this.mockMode = !this.apiKey || this.apiKey.length < 10;

    if (this.mockMode) {
      logger.warn(
        { provider: 'paymob' },
        'PaymobPaymentProvider running in MOCK mode — no real API calls will be made. Set PAYMOB_API_KEY to enable live mode.'
      );
    }
  }

  /**
   * Creates a Paymob payment intention.
   * Returns an object with id (intentionId), clientSecret, and payUrl.
   */
  async createPaymentIntent({
    orderNumber,
    total,
    currency,
    customerEmail,
    customerName,
    customerPhone,
    lineItems = [],
  }) {
    if (!orderNumber || total <= 0) {
      throw new Error('Invalid order: orderNumber and positive total required');
    }

    // Convert integer minor units to decimal string (Paymob expects "10.00" for 1000 piastres)
    const amountDecimal = (total / 100).toFixed(2);

    if (this.mockMode) {
      return this._mockCreateIntent({ orderNumber, total, currency, customerEmail });
    }

    const payload = {
      amount: amountDecimal,
      currency: currency || 'EGP',
      payment_methods: [parseInt(this.integrationId, 10)],
      items: lineItems.map((item) => ({
        name: item.title || item.name || 'Product',
        amount: (item.unitPrice / 100).toFixed(2),
        description: item.sku || '',
        quantity: String(item.quantity),
      })),
      billing_data: {
        apartment: 'NA',
        email: customerEmail || 'guest@neckline.store',
        floor: 'NA',
        first_name: customerName?.split(' ')[0] || 'Guest',
        street: 'NA',
        building: 'NA',
        phone_number: customerPhone || '01000000000',
        shipping_method: 'PKG',
        postal_code: '00000',
        city: 'Cairo',
        country: 'EG',
        last_name: customerName?.split(' ').slice(1).join(' ') || 'Customer',
        state: 'Cairo',
      },
      customer: {
        first_name: customerName?.split(' ')[0] || 'Guest',
        last_name: customerName?.split(' ').slice(1).join(' ') || 'Customer',
        email: customerEmail || 'guest@neckline.store',
      },
      delivery_needed: false,
    };

    try {
      const response = await axios.post(`${this.baseUrl}/v1/intention`, payload, {
        headers: {
          Authorization: `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      });

      const intention = response.data;
      const clientSecret = intention.client_secret;
      const payUrl = `${this.baseUrl}/unifiedcheckout/?publicKey=${this._publicKeyFromApiKey()}&clientSecret=${clientSecret}`;

      logger.info(
        { orderNumber, intentionId: intention.id, provider: 'paymob' },
        'Paymob intention created'
      );

      return {
        id: intention.id,
        status: 'requires_confirmation',
        clientSecret,
        amount: total,
        currency: currency || 'EGP',
        payUrl,
        raw: intention,
      };
    } catch (err) {
      logger.error(
        { err: err.message, orderNumber, provider: 'paymob' },
        'Paymob intention creation failed'
      );
      throw new Error(`Paymob intention creation failed: ${err.message}`);
    }
  }

  /**
   * Confirm payment by querying intention status.
   * Used as a polling fallback when webhooks are delayed.
   */
  async confirmPayment(intentId) {
    if (this.mockMode) {
      return this._mockConfirmIntent(intentId);
    }

    try {
      const response = await axios.get(`${this.baseUrl}/v1/intention/${intentId}`, {
        headers: {
          Authorization: `Token ${this.apiKey}`,
        },
        timeout: 10000,
      });

      const intention = response.data;
      const isPaid = intention.status === 'paid' || intention.status === 'captured';

      if (isPaid) {
        const transaction = intention.transactions?.[0];
        return {
          success: true,
          transactionId: transaction?.id || `paymob_txn_${Date.now()}`,
          status: 'succeeded',
          amount: Math.round(parseFloat(intention.amount) * 100),
          currency: intention.currency,
        };
      }

      return {
        success: false,
        status: intention.status || 'pending',
        errorCode: 'paymob_pending',
        errorMessage: `Payment status: ${intention.status}`,
      };
    } catch (err) {
      logger.error({ err: err.message, intentId }, 'Paymob confirmPayment failed');
      return {
        success: false,
        status: 'failed',
        errorCode: 'paymob_confirm_error',
        errorMessage: err.message,
      };
    }
  }

  /**
   * Refund a previously successful payment.
   */
  async refund(transactionId, amount) {
    if (this.mockMode) {
      return this._mockRefund(transactionId, amount);
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/v1/transaction/refund`,
        {
          transaction_id: transactionId,
          amount_cents: amount,
        },
        {
          headers: {
            Authorization: `Token ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      const refund = response.data;
      return {
        success: true,
        refundId: refund.id || `paymob_refund_${Date.now()}`,
        amount,
        currency: 'EGP',
        status: 'succeeded',
      };
    } catch (err) {
      logger.error({ err: err.message, transactionId }, 'Paymob refund failed');
      return {
        success: false,
        amount,
        currency: 'EGP',
        status: 'failed',
        errorMessage: err.message,
      };
    }
  }

  // ─── Mock implementations for development / CI ───

  _mockCreateIntent({ orderNumber, total, currency, customerEmail }) {
    const intentId = `paymob_mock_intent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const clientSecret = `cs_mock_${Math.random().toString(36).slice(2, 16)}`;
    const payUrl = `https://accept.paymob.com/unifiedcheckout/?publicKey=mock&clientSecret=${clientSecret}`;

    logger.info(
      { orderNumber, intentId, provider: 'paymob', mode: 'mock' },
      'Paymob intention created (MOCK)'
    );

    return {
      id: intentId,
      status: 'requires_confirmation',
      clientSecret,
      amount: total,
      currency: currency || 'EGP',
      payUrl,
      raw: { mock: true },
    };
  }

  _mockConfirmIntent(intentId) {
    // In mock mode, simulate success for any intent that exists
    return {
      success: true,
      transactionId: `paymob_mock_txn_${Date.now()}`,
      status: 'succeeded',
      amount: 0,
      currency: 'EGP',
    };
  }

  _mockRefund(transactionId, amount) {
    return {
      success: true,
      refundId: `paymob_mock_refund_${Date.now()}`,
      amount,
      currency: 'EGP',
      status: 'succeeded',
    };
  }

  _publicKeyFromApiKey() {
    // Paymob public key is typically derived from the secret key prefix
    // In production, this should be a separate env var
    if (this.apiKey && this.apiKey.startsWith('pk_')) {
      return this.apiKey;
    }
    if (this.apiKey && this.apiKey.startsWith('skl_')) {
      return this.apiKey.replace('skl_', 'pk_');
    }
    return 'pk_mock';
  }
}

module.exports = PaymobPaymentProvider;
