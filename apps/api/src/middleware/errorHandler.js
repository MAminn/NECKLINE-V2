const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const isServerError = statusCode >= 500;

  logger.error(
    {
      err: {
        message: err.message,
        stack: isServerError ? err.stack : undefined,
        statusCode,
      },
      requestId: req.id,
      correlationId: req.correlationId,
    },
    'Request error'
  );

  const response = {
    error: true,
    message: statusCode === 500 ? 'Internal server error' : err.message,
    requestId: req.id,
  };

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
