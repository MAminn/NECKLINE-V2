const { randomUUID } = require('crypto');

function requestIdMiddleware(req, res, next) {
  const requestId = req.get('x-request-id') || randomUUID();
  const correlationId = req.get('x-correlation-id') || randomUUID();

  req.id = requestId;
  req.correlationId = correlationId;

  res.setHeader('x-request-id', requestId);
  res.setHeader('x-correlation-id', correlationId);

  next();
}

module.exports = requestIdMiddleware;
