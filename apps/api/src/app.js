const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');

const env = require('./config/env');
const logger = require('./config/logger');
const requestIdMiddleware = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');
const v1Routes = require('./routes/v1');

function createApp() {
  const app = express();

  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({
        requestId: req.id,
        correlationId: req.correlationId,
      }),
    })
  );

  app.use('/api/v1', v1Routes);

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
