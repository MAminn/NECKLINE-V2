const path = require('path');
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
const webhookRoutes = require('./routes/v1/webhooks');
const verifyPaymobWebhook = require('./middleware/verifyPaymobWebhook');

function createApp() {
  const app = express();

  // Behind a reverse proxy, req.ip / req.socket.remoteAddress is the proxy's IP for
  // every client, so the per-IP rate limiters (which key on req.ip) would collapse all
  // traffic into one bucket. Tell Express how many proxy hops to trust so it resolves the
  // real client IP from X-Forwarded-For. A numeric hop count (never `true`) means Express
  // counts from the right and ignores any extra left-most entries a client tries to forge,
  // and also keeps express-rate-limit's permissive-trust-proxy validation from erroring.
  app.set('trust proxy', env.TRUST_PROXY);

  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    })
  );

  // Webhook route MUST be mounted BEFORE express.json() to preserve raw body for HMAC verification
  app.post('/api/v1/webhooks/paymob', requestIdMiddleware, verifyPaymobWebhook, webhookRoutes);

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

  // Serve uploaded images locally when Cloudinary is not configured.
  app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
