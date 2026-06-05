/**
 * PaymentProvider interface
 * All concrete providers (stub, Stripe, etc.) must implement this interface.
 */

class PaymentProvider {
  constructor() {
    // How this provider settles payment, so callers branch on capability — not provider name:
    //   'sync'     — confirmPayment() settles inline during checkout.
    //   'redirect' — createPaymentIntent() returns a payUrl; settlement arrives via webhook.
    this.mode = 'sync';
  }

  /**
   * Creates a payment intent for the given order.
   * @param {Object} order
   * @param {string} order.orderNumber
   * @param {number} order.total - integer minor units
   * @param {string} order.currency - ISO 4217
   * @param {string} order.customerEmail
   * @returns {Promise<{id: string, status: string, clientSecret?: string, amount: number, currency: string}>}
   */
  async createPaymentIntent(_order) {
    throw new Error('createPaymentIntent must be implemented');
  }

  /**
   * Confirms the payment intent, charging the customer.
   * @param {string} intentId
   * @returns {Promise<{success: boolean, transactionId?: string, status: string, errorCode?: string, errorMessage?: string}>}
   */
  async confirmPayment(_intentId) {
    throw new Error('confirmPayment must be implemented');
  }

  /**
   * Refunds a previously successful payment.
   * @param {string} transactionId
   * @param {number} amount - integer minor units
   * @returns {Promise<{success: boolean, refundId?: string, amount: number, currency: string, status: string, errorMessage?: string}>}
   */
  async refund(_transactionId, _amount) {
    throw new Error('refund must be implemented');
  }
}

module.exports = PaymentProvider;
