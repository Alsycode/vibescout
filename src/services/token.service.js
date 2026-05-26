// FILE: src/services/token.service.js
// PURPOSE: JWT sign and verify helpers for auth system

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(payload) {
  return jwt.sign(
    {
      userId: payload.userId,
      email:  payload.email,
      name:   payload.name,
      role:   payload.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
