const mongoose = require('mongoose');
const FeatureFlag = require('../src/models/FeatureFlag');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  await FeatureFlag.findOneAndUpdate(
    { name: 'paymob_enabled' },
    {
      name: 'paymob_enabled',
      enabled: false, // Start disabled; enable when ready to go live
      scope: 'payment',
      description: 'Enable Paymob payment provider for checkout',
      changedBy: 'system',
    },
    { upsert: true }
  );

  console.log('Feature flag "paymob_enabled" seeded (disabled by default)');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
