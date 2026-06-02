require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../src/config/env');
const ShippingMethod = require('../src/models/ShippingMethod');

async function seed() {
  await mongoose.connect(env.MONGODB_URI);

  const existing = await ShippingMethod.findOne({ name: 'Standard Delivery' });
  if (existing) {
    console.log('Shipping method already seeded:', existing.name);
    await mongoose.disconnect();
    return;
  }

  await ShippingMethod.create({
    name: 'Standard Delivery',
    description: '3-5 business days',
    cost: env.SHIPPING_STANDARD_COST,
    currency: env.SHIPPING_CURRENCY,
    estimatedMinDays: 3,
    estimatedMaxDays: 5,
    isActive: true,
    sortOrder: 1,
  });

  console.log('Seeded shipping method: Standard Delivery');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
