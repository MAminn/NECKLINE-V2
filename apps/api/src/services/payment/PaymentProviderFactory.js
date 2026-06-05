const StubPaymentProvider = require('./StubPaymentProvider');
const PaymobPaymentProvider = require('./PaymobPaymentProvider');
const env = require('../../config/env');

function createPaymentProvider() {
  const provider = env.PAYMENT_PROVIDER || 'stub';

  switch (provider) {
    case 'stub':
      return new StubPaymentProvider();
    case 'paymob':
      return new PaymobPaymentProvider();
    default:
      throw new Error(`Unknown payment provider: ${provider}`);
  }
}

module.exports = { createPaymentProvider };
