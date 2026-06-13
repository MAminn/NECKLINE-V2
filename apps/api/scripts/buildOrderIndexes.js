/**
 * Builds Order indexes in environments where autoIndex is disabled (production —
 * see src/config/db.js: autoIndex is on only when NODE_ENV !== 'production').
 *
 * Run once per deploy that changes the Order schema's indexes:
 *   node scripts/buildOrderIndexes.js
 *
 * syncIndexes() creates any index declared on the schema but missing in Mongo, and
 * DROPS any index in Mongo that is no longer declared on the schema. Run it knowingly.
 * On a large orders collection prefer a low-traffic window; index builds hold resources.
 */
const mongoose = require('mongoose');
const env = require('../src/config/env');
const logger = require('../src/config/logger');
const Order = require('../src/models/Order');

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  logger.info('Connected — syncing Order indexes...');
  const dropped = await Order.syncIndexes();
  logger.info({ dropped }, 'Order indexes synced');
  await mongoose.disconnect();
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to build Order indexes');
  process.exit(1);
});
