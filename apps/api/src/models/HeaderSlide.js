const mongoose = require('mongoose');

const headerSlideSchema = new mongoose.Schema(
  {
    image:       { type: String, required: true, trim: true },
    title:       { type: String, required: true, trim: true, maxlength: 100 },
    subtitle:    { type: String, trim: true, maxlength: 200, default: '' },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    buttonText:  { type: String, trim: true, maxlength: 50, default: 'Shop Now' },
    linkTo:      { type: String, enum: ['collection', 'story', 'reviews'], default: 'collection' },
    order:       { type: Number, default: 0 },
    active:      { type: Boolean, default: true },
  },
  { timestamps: true }
);

headerSlideSchema.index({ active: 1, order: 1 });

module.exports = mongoose.model('HeaderSlide', headerSlideSchema);
