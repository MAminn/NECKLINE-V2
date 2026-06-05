const mongoose = require('mongoose');
const User = require('../src/models/User');
const { hashPassword } = require('../src/utils/passwordUtils');

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb://dev:devpassword@localhost:27017/neckline?authSource=admin';

async function seed() {
  await mongoose.connect(MONGODB_URI);

  const email = 'admin@neckline.com';
  const password = 'Admin123!';

  const existing = await User.findOne({ email });

  if (existing) {
    // Promote existing user to admin
    existing.role = 'admin';
    await existing.save();
    console.log(`Updated existing user ${email} → role: admin`);
  } else {
    const passwordHash = await hashPassword(password);
    await User.create({
      name: 'Admin',
      email,
      passwordHash,
      role: 'admin',
      emailVerified: true,
    });
    console.log(`Created admin user: ${email} / ${password}`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
