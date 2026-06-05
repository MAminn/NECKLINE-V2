const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      uppercase: true,
      set: (v) => (v ? v.toString().toUpperCase().trim() : v),
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'free_shipping'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
      min: 0,
    },
    usageLimit: {
      type: Number,
      default: null,
      min: 1,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
    isAutomatic: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Indexes
promoCodeSchema.index({ code: 1 }, { unique: true, sparse: true });
promoCodeSchema.index({ isAutomatic: 1, active: 1, startDate: 1, endDate: 1 });
promoCodeSchema.index({ active: 1, startDate: 1, endDate: 1 });

// Validation: endDate must be after startDate
promoCodeSchema.pre('save', function (next) {
  if (this.startDate && this.endDate && this.endDate <= this.startDate) {
    return next(new Error('endDate must be after startDate'));
  }
  if (this.type === 'percentage' && this.value > 100) {
    return next(new Error('Percentage discount value cannot exceed 100'));
  }
  if (this.isAutomatic && this.code) {
    return next(new Error('Automatic offers must not have a code'));
  }
  if (!this.isAutomatic && !this.code) {
    return next(new Error('Manual promo codes must have a code'));
  }
  next();
});

module.exports = mongoose.model('PromoCode', promoCodeSchema);
