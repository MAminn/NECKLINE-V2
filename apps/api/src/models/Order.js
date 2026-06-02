const mongoose = require('mongoose');

const orderLineItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    sku: { type: String, required: true },
    title: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 }, // integer minor units
    currency: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    lineTotal: { type: Number, required: true, min: 0 }, // integer minor units
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    governorate: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: 'Egypt' },
  },
  { _id: false }
);

const shippingMethodSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    cost: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed'],
      default: 'pending',
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
      default: null,
    },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    shippingAddress: { type: addressSchema, required: true },
    shippingMethod: { type: shippingMethodSnapshotSchema, required: true },
    lineItems: { type: [orderLineItemSchema], required: true, validate: [(arr) => arr.length > 0, 'Order must have at least one line item'] },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'succeeded', 'failed'],
      default: 'pending',
    },
    paymentTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentTransaction',
      default: null,
    },
    idempotencyKey: { type: String, index: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Indexes
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ customerEmail: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
