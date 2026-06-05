const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema(
  {
    num:           { type: String, required: true },
    title:         { type: String, required: true, trim: true },
    desc:          { type: String, required: true, trim: true },
    iconType:      { type: String, enum: ['preset', 'custom'], default: 'preset' },
    presetName:    { type: String, trim: true, default: '' },
    customIconUrl: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const howToApplySchema = new mongoose.Schema(
  {
    configKey: { type: String, default: 'default', unique: true },
    color:     { type: String, default: '#D21B27', trim: true },
    steps:     [stepSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('HowToApply', howToApplySchema);
