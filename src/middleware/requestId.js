// FILE: src/middleware/requestId.js
// PURPOSE: SEC-06 — a per-request correlation id. Attached to every response
// (`X-Request-Id` header) and echoed in generic 5xx error bodies, so a user
// reporting "it broke" can hand support one opaque id that maps straight to
// the full error detail in the server log — without exposing that detail
// itself in the response.

import crypto from 'crypto';

export function requestId(req, res, next) {
  // Generated server-side only — never trust a client-supplied id for this,
  // it's a log-correlation token, not something to let a caller inject.
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}
