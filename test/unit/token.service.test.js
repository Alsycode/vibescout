// FILE: test/unit/token.service.test.js
import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { signToken, verifyToken } from '../../src/services/token.service.js';

const payload = { userId: 'u1', email: 'a@b.com', name: 'A', role: 'user' };

describe('token.service', () => {
  it('signs then verifies a token round-trip', () => {
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded).toMatchObject(payload);
  });

  it('rejects a tampered token', () => {
    const token = signToken(payload);
    const tampered = token.slice(0, -3) + 'xyz';
    expect(() => verifyToken(tampered)).toThrow();
  });

  it('rejects an expired token', () => {
    const expired = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: -10 });
    expect(() => verifyToken(expired)).toThrow(/expired/i);
  });

  it('rejects a token signed with the wrong secret', () => {
    const wrong = jwt.sign(payload, 'some-other-secret-value-not-ours-32ch');
    expect(() => verifyToken(wrong)).toThrow();
  });
});
