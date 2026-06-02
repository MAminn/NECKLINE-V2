const PaymentProvider = require('./PaymentProvider');
const env = require('../../config/env');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class StubPaymentProvider extends PaymentProvider {
  constructor() {
    super();
    this.latencyMs = env.STUB_PAYMENT_LATENCY_MS;
    this.failureRate = env.STUB_PAYMENT_FAILURE_RATE;
    this.declineEmails = new Set(
      env.STUB_PAYMENT_DECLINE_EMAILS.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    );
    this.intents = new Map(); // in-memory store for stub intents
  }

  async createPaymentIntent(order) {
    if (!order || order.total <= 0) {
      throw new Error('Invalid order total');
    }

    await sleep(this.latencyMs);

    const intentId = `stub_intent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const intent = {
      id: intentId,
      status: 'requires_confirmation',
      amount: order.total,
      currency: order.currency,
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      createdAt: new Date(),
    };

    this.intents.set(intentId, intent);

    return {
      id: intentId,
      status: 'requires_confirmation',
      amount: order.total,
      currency: order.currency,
    };
  }

  async confirmPayment(intentId) {
    await sleep(this.latencyMs);

    const intent = this.intents.get(intentId);
    if (!intent) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'stub_invalid_intent',
        errorMessage: 'Payment intent not found',
      };
    }

    // Deterministic test hook: intent IDs ending in _fail always fail
    if (intentId.endsWith('_fail')) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'stub_decline',
        errorMessage: 'Payment declined (deterministic test hook)',
      };
    }

    // Email-based decline list
    if (intent.customerEmail && this.declineEmails.has(intent.customerEmail.toLowerCase())) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'stub_decline',
        errorMessage: 'Payment declined (email on decline list)',
      };
    }

    // Random failure simulation
    if (this.failureRate > 0 && Math.random() < this.failureRate) {
      return {
        success: false,
        status: 'failed',
        errorCode: 'stub_decline',
        errorMessage: 'Payment declined (random failure simulation)',
      };
    }

    const transactionId = `stub_txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return {
      success: true,
      transactionId,
      status: 'succeeded',
      amount: intent.amount,
      currency: intent.currency,
    };
  }

  async refund(transactionId, amount) {
    await sleep(this.latencyMs);

    const refundId = `stub_refund_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return {
      success: true,
      refundId,
      amount,
      currency: 'EGP', // simplified for stub
      status: 'succeeded',
    };
  }
}

module.exports = StubPaymentProvider;
