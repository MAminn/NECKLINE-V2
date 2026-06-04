const logger = require('../config/logger');

// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by its 4-arg arity
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const isServerError = statusCode >= 500;

  // Domain errors (CheckoutError, CartError, AuthError, DiscountError) opt in via an explicit
  // `isOperational` flag and carry a curated, user-safe message + code. Everything else —
  // including Node/Mongo system errors that happen to expose an `err.code` (ECONNREFUSED,
  // 11000, …) — stays masked at 500 so internals never leak.
  const isOperational = err.isOperational === true;

  logger.error(
    {
      err: {
        message: err.message,
        stack: isServerError ? err.stack : undefined,
        statusCode,
        code: err.code,
      },
      requestId: req.id,
      correlationId: req.correlationId,
    },
    'Request error'
  );

  const response = {
    error: true,
    message: isServerError && !isOperational ? 'Internal server error' : err.message,
    requestId: req.id,
  };
  if (isOperational && err.code) response.code = err.code;

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
