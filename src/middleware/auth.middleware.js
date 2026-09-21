// FILE: src/middleware/auth.middleware.js
// PURPOSE: JWT auth guards — requireAuth for customer routes, requireAdminAuth for
//          admin routes. The two use separate cookies and separate token audiences
//          so a customer session can never be replayed against admin routes.

import { verifyToken, verifyAdminToken } from '../services/token.service.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.vb_session ?? req.cookies?.vb_token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Admin routes use their own cookie (vb_admin_session) and audience-scoped token
// (see token.service.js) rather than requireAuth.
export function requireAdminAuth(req, res, next) {
  const token = req.cookies?.vb_admin_session;
  if (!token) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }

  try {
    const decoded = verifyAdminToken(token);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired admin session' });
  }
}
