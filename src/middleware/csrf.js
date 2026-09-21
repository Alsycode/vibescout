// FILE: src/middleware/csrf.js
// PURPOSE: SEC-03 — Origin/Referer allowlist for state-changing requests. Auth
// is cookie-based (`vb_session`/`vb_admin_session`, sent automatically by the
// browser), so without this a malicious page could POST to any mutating route
// with the victim's ambient cookie. This is the first of two layers — the
// second is switching the cookies' `sameSite` from 'none' to 'lax' (see
// auth.routes.js / admin/auth.admin.routes.js), safe because the frontend only
// ever talks to the API same-origin through the Next.js `/api/*` rewrite.

function requestOrigin(req) {
  if (req.headers.origin) return req.headers.origin;
  if (req.headers.referer) {
    try {
      return new URL(req.headers.referer).origin;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * @param {string[]} allowedOrigins - origins allowed to make state-changing requests
 */
export function csrfProtection(allowedOrigins = []) {
  const allowed = new Set(allowedOrigins.filter(Boolean));

  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return next();
    }

    const origin = requestOrigin(req);

    // No Origin and no (parseable) Referer at all — not the CSRF vector this
    // guards against. A browser always attaches Origin (or at minimum
    // Referer) to a cross-site fetch/XHR/form POST; requests with neither are
    // non-browser clients (server-to-server calls, curl, Postman) that don't
    // carry the victim's ambient cookie in the first place.
    if (!origin) {
      return next();
    }

    if (!allowed.has(origin)) {
      return res.status(403).json({ error: 'Request origin not allowed' });
    }

    return next();
  };
}
