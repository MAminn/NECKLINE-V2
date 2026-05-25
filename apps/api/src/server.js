require('dotenv').config();

const createApp = require('./app');
const { connect, disconnect } = require('./config/db');
const logger = require('./config/logger');
const env = require('./config/env');

const app = createApp();
const server = app.listen(env.PORT, async () => {
  try {
    await connect();
    logger.info(`API server listening on port ${env.PORT} [${env.NODE_ENV}]`);
  } catch (err) {
    logger.warn({ err }, 'MongoDB not available — running in demo mode');
    logger.info(`API server listening on port ${env.PORT} [${env.NODE_ENV}] (demo mode)`);
  }
});

function gracefulShutdown(signal) {
  logger.info({ signal }, 'Received signal, shutting down gracefully');
  server.close(async () => {
    await disconnect();
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
