const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true, maxlength: 100 },
    product:  { type: String, required: true, trim: true, maxlength: 100 },
    rating:   { type: Number, required: true, min: 1, max: 5 },
    comment:  { type: String, required: true, trim: true, maxlength: 1000 },
    verified: { type: Boolean, default: false },
    date:     { type: String, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

testimonialSchema.index({ deletedAt: 1, createdAt: -1 });

module.exports = mongoose.model('Testimonial', testimonialSchema);
