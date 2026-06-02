const StubPaymentProvider = require('./StubPaymentProvider');

function createPaymentProvider() {
  const provider = process.env.PAYMENT_PROVIDER || 'stub';

  switch (provider) {
    case 'stub':
      return new StubPaymentProvider();
    // case 'stripe': return new StripePaymentProvider(config); // Phase 5
    default:
      throw new Error(`Unknown payment provider: ${provider}`);
  }
}

module.exports = { createPaymentProvider };
