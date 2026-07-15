// FILE: src/routes/auth.routes.js
// PURPOSE: Auth routes — register, login, logout, me

import { Router } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '../models/User.js';
import { signToken } from '../services/token.service.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { sendPasswordResetEmail } from '../services/email.service.js';

const router = Router();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
  path:     '/',
};

// POST /auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: 'user',
    });

    const token = signToken({
      userId: user._id,
      email:  user.email,
      name:   user.name,
      role:   user.role,
    });

    res.cookie('vb_session', token, COOKIE_OPTIONS);
    return res.status(201).json({
      token,
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

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({
      userId: user._id,
      email:  user.email,
      name:   user.name,
      role:   user.role,
    });

    res.cookie('vb_session', token, COOKIE_OPTIONS);
    return res.json({
      token,
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

// POST /auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('vb_session', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path:     '/',
  });
  res.clearCookie('vb_token', {
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
  });
  return res.json({ ok: true });
});

// GET /auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.json({
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        phone: user.phone,
        role:  user.role,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/forgot-password — generate reset token, send email
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent user enumeration
    if (!user) return res.json({ ok: true });

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await User.findByIdAndUpdate(user._id, {
      resetToken: token,
      resetTokenExpiry: expiry,
    });

    await sendPasswordResetEmail(user.email, token);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /auth/reset-password — verify token, set new password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ error: 'Invalid or expired reset link' });

    const passwordHash = await bcrypt.hash(password, 12);
    await User.findByIdAndUpdate(user._id, {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
    });

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// PUT /auth/profile — update name and phone
router.put('/profile', requireAuth, async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

    const updated = await User.findByIdAndUpdate(
      req.user.userId,
      { name: name.trim(), phone: phone?.trim() ?? null },
      { new: true, select: '-passwordHash' },
    );

    return res.json({ user: { id: updated._id, name: updated.name, email: updated.email, phone: updated.phone, role: updated.role } });
  } catch (err) {
    next(err);
  }
});

// PUT /auth/password — change password (requires current password)
router.put('/password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const user = await User.findById(req.user.userId);
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(req.user.userId, { passwordHash });

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
