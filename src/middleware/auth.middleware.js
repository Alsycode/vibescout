// FILE: src/middleware/auth.middleware.js
// PURPOSE: JWT auth guards — requireAuth for protected routes, requireAdmin for admin routes

import { verifyToken } from '../services/token.service.js';

export function requireAuth(req, res, next) {
  const token = req.cookies?.vb_token;
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

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
