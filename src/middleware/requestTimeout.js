// FILE: src/middleware/requestTimeout.js
// PURPOSE: PERF-8 — bound how long a single request can run; return 503
//          instead of leaving a worker/connection hanging forever.

export function requestTimeout(ms) {
  return (req, res, next) => {
    res.setTimeout(ms, () => {
      if (!res.headersSent) {
        res.status(503).json({ error: 'Request timeout' });
      }
    });
    next();
  };
}
