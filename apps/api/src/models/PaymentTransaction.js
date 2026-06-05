const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    provider: { type: String, required: true },
    providerTransactionId: { type: String },
    intentId: { type: String, index: true },
    amount: { type: Number, required: true, min: 0 }, // integer minor units
    currency: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed'],
      default: 'pending',
    },
    errorCode: { type: String },
    errorMessage: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);
