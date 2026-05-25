const mongoose = require('mongoose');
const logger = require('./logger');
const env = require('./env');

let connected = false;

async function connect(retries = 5, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(env.MONGODB_URI, {
        autoIndex: env.NODE_ENV !== 'production',
      });
      connected = true;
      logger.info('MongoDB connected');
      return;
    } catch (err) {
      logger.warn({ attempt, retries, err: err.message }, 'MongoDB connection failed, retrying...');
      if (attempt === retries) {
        logger.fatal({ err }, 'MongoDB connection exhausted all retries');
        throw err;
      }
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

async function disconnect() {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
  logger.info('MongoDB disconnected');
}

function isConnected() {
  return connected && mongoose.connection.readyState === 1;
}

module.exports = { connect, disconnect, isConnected };
