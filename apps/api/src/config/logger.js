const pino = require('pino');
const env = require('./env');

const isDev = env.NODE_ENV === 'development';

const logger = pino({
  level: env.LOG_LEVEL,
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  redact: {
    paths: [
      '*.password',
      '*.token',
      '*.secret',
      '*.apiKey',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    remove: true,
  },
  base: {
    service: 'neckline-api',
  },
});

module.exports = logger;
