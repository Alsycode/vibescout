// FILE: src/middleware/errorHandler.js
// PURPOSE: Catches all unhandled errors and returns { error: message } JSON

export function errorHandler(err, req, res, next) {
  console.error('[ErrorHandler]', err.stack || err.message);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}
