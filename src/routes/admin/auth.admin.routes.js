// FILE: src/routes/admin/auth.admin.routes.js
// PURPOSE: Admin-only login/logout/me — separate cookie (vb_admin_session) and
//          audience-scoped JWT from the customer auth flow in auth.routes.js.

import { Router } from 'express';
import bcrypt from 'bcrypt';
import User from '../../models/User.js';
import { signAdminToken } from '../../services/token.service.js';
import { requireAdminAuth } from '../../middleware/auth.middleware.js';

const router = Router();

const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   4 * 60 * 60 * 1000, // 4 hours — shorter-lived than customer sessions
  path:     '/',
};

// POST /admin/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    // Same generic error whether the account doesn't exist, the password is
    // wrong, or the account isn't an admin — avoids leaking which case it was.
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signAdminToken({
      userId: user._id,
      email:  user.email,
      name:   user.name,
      role:   user.role,
    });

    res.cookie('vb_admin_session', token, ADMIN_COOKIE_OPTIONS);
    return res.json({
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /admin/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('vb_admin_session', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path:     '/',
  });
  return res.json({ ok: true });
});

// GET /admin/auth/me
router.get('/me', requireAdminAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user || user.role !== 'admin') {
      return res.status(404).json({ error: 'Admin not found' });
    }
    return res.json({
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
