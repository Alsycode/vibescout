// FILE: src/middleware/errorHandler.js
// PURPOSE: Catches all unhandled errors and returns { error: message } JSON.
//
// SEC-06 — a 500 used to send `err.message` straight to the client, which for
// an unexpected failure is often a raw Mongo/driver/third-party error string
// (connection strings, internal field names, stack-adjacent detail). In
// production, a 5xx now gets a generic message + the request's correlation
// id (see requestId.js); the real error always goes to the log either way.
// 4xx bodies are untouched — those messages are written by route handlers on
// purpose (e.g. "Invalid payment signature"), not leaked internals.

// `_next` stays in the signature (unused) because Express only treats a 4-arg
// function as error-handling middleware.
export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const requestId = req.id;

  console.error(`[ErrorHandler] ${requestId ?? 'no-request-id'}`, err.stack || err.message);

  if (status >= 500 && process.env.NODE_ENV === 'production') {
    return res.status(status).json({ error: 'Internal server error', requestId });
  }

  res.status(status).json({ error: err.message || 'Internal server error', requestId });
}
