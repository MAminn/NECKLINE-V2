const mongoose = require('mongoose');
const PromoCode = require('../src/models/PromoCode');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/neckline');

  const codes = [
    {
      code: 'SAVE10',
      type: 'percentage',
      value: 10,
      minOrderAmount: 0,
      usageLimit: null,
      active: true,
      isAutomatic: false,
      description: '10% off any order',
    },
    {
      code: 'SAVE500',
      type: 'fixed',
      value: 50000, // 500 EGP in piasters
      minOrderAmount: 200000, // 2000 EGP minimum
      usageLimit: null,
      active: true,
      isAutomatic: false,
      description: '500 EGP off orders over 2000 EGP',
    },
    {
      code: 'FREESHIP',
      type: 'free_shipping',
      value: 0,
      minOrderAmount: 300000, // 3000 EGP minimum
      usageLimit: null,
      active: true,
      isAutomatic: false,
      description: 'Free shipping on orders over 3000 EGP',
    },
    {
      code: null,
      type: 'percentage',
      value: 15,
      minOrderAmount: 800000, // 8000 EGP minimum
      usageLimit: null,
      active: true,
      isAutomatic: true,
      description: 'Summer Sale: 15% off orders over 8000 EGP',
    },
  ];

  for (const code of codes) {
    await PromoCode.findOneAndUpdate(
      { code: code.code, isAutomatic: code.isAutomatic },
      code,
      { upsert: true, new: true }
    );
    console.log(`Seeded: ${code.code || '[AUTO]'} — ${code.description}`);
  }

  await mongoose.disconnect();
  console.log('Done seeding promo codes.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
