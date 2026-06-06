require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../src/models/User');
const { hashPassword } = require('../src/utils/passwordUtils');

// All credentials come from the environment — no hardcoded fallbacks.
// Set these in apps/api/.env (gitignored) or your deployment's secret store.
const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

const missing = [
  !MONGODB_URI && 'MONGODB_URI',
  !ADMIN_EMAIL && 'SEED_ADMIN_EMAIL',
  !ADMIN_PASSWORD && 'SEED_ADMIN_PASSWORD',
].filter(Boolean);

if (missing.length > 0) {
  console.error(`Missing required env var(s): ${missing.join(', ')}`);
  console.error('Set them in apps/api/.env or your secret store before seeding.');
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGODB_URI);

  const existing = await User.findOne({ email: ADMIN_EMAIL });

  if (existing) {
    // Promote to admin and rotate the password to the current env value.
    existing.role = 'admin';
    existing.passwordHash = await hashPassword(ADMIN_PASSWORD);
    await existing.save();
    console.log(`Updated existing user ${ADMIN_EMAIL} → role: admin, password rotated`);
  } else {
    const passwordHash = await hashPassword(ADMIN_PASSWORD);
    await User.create({
      name: 'Admin',
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'admin',
      emailVerified: true,
    });
    // Never log the password — operator already knows it from the env var.
    console.log(`Created admin user: ${ADMIN_EMAIL}`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
