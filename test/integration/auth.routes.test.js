// FILE: test/integration/auth.routes.test.js
// PURPOSE: Stage 3 — /auth integration tests against the real test DB.
//          register/login/logout/me/forgot-reset/profile/password: happy
//          path, validation, and authn.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { agent, setupDb, teardownDb } from './helpers.js';
import { seedUsers, SEED_PASSWORD } from '../fixtures/seedData.js';
import User from '../../src/models/User.js';

describe('auth routes', () => {
  beforeAll(async () => {
    await setupDb();
  });

  afterAll(async () => {
    await teardownDb();
  });

  describe('POST /auth/register', () => {
    it('registers a new user, sets vb_session cookie, never returns the raw JWT', async () => {
      const res = await agent.post('/auth/register').send({
        name: 'New Guy',
        email: 'new-guy@haum.test',
        password: 'Test1234!',
        phone: '+919000009999',
      });
      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('new-guy@haum.test');
      expect(res.body.token).toBeUndefined();
      expect(JSON.stringify(res.body)).not.toMatch(/eyJ/); // no JWT-looking string anywhere in body
      const setCookie = res.headers['set-cookie'].join(';');
      expect(setCookie).toMatch(/vb_session=/);
      expect(setCookie).toMatch(/HttpOnly/i);
    });

    it('rejects a duplicate email', async () => {
      const res = await agent.post('/auth/register').send({
        name: 'Dup',
        email: seedUsers.user1.email,
        password: 'Test1234!',
        phone: '+919000000009',
      });
      expect(res.status).toBe(409);
    });

    it('rejects a weak (short) password', async () => {
      const res = await agent.post('/auth/register').send({
        name: 'Weak',
        email: 'weak@haum.test',
        password: '123',
        phone: '+919000000008',
      });
      expect(res.status).toBe(400);
    });

    it('rejects a missing phone', async () => {
      const res = await agent.post('/auth/register').send({
        name: 'NoPhone',
        email: 'nophone@haum.test',
        password: 'Test1234!',
      });
      expect(res.status).toBe(400);
    });

    it('normalises email to lowercase', async () => {
      const res = await agent.post('/auth/register').send({
        name: 'Case Test',
        email: 'CaseTest@Haum.TEST',
        password: 'Test1234!',
        phone: '+919000000007',
      });
      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('casetest@haum.test');
    });
  });

  describe('POST /auth/login', () => {
    it('logs in with correct credentials and sets the cookie', async () => {
      const res = await agent.post('/auth/login').send({
        email: seedUsers.user1.email,
        password: SEED_PASSWORD,
      });
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(seedUsers.user1.email);
      expect(res.headers['set-cookie'].join(';')).toMatch(/vb_session=/);
    });

    it('rejects the wrong password', async () => {
      const res = await agent.post('/auth/login').send({
        email: seedUsers.user1.email,
        password: 'wrong-password',
      });
      expect(res.status).toBe(401);
    });

    it('rejects an unknown email', async () => {
      const res = await agent.post('/auth/login').send({
        email: 'nobody@haum.test',
        password: 'whatever123',
      });
      expect(res.status).toBe(401);
    });

    it('response body never contains the raw JWT (SEC-04)', async () => {
      const res = await agent.post('/auth/login').send({
        email: seedUsers.user1.email,
        password: SEED_PASSWORD,
      });
      expect(JSON.stringify(res.body)).not.toMatch(/eyJ/);
    });
  });

  describe('POST /auth/logout', () => {
    it('clears the session cookie', async () => {
      const res = await agent.post('/auth/logout');
      expect(res.status).toBe(200);
      const setCookie = res.headers['set-cookie'].join(';');
      expect(setCookie).toMatch(/vb_session=;/);
    });
  });

  describe('GET /auth/me', () => {
    it('requires auth', async () => {
      const res = await agent.get('/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns the caller and never passwordHash', async () => {
      const login = await agent.post('/auth/login').send({ email: seedUsers.user1.email, password: SEED_PASSWORD });
      const cookie = login.headers['set-cookie'];
      const res = await agent.get('/auth/me').set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(seedUsers.user1.email);
      expect(res.body.user.passwordHash).toBeUndefined();
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('always returns 200 for a known email (no enumeration)', async () => {
      const res = await agent.post('/auth/forgot-password').send({ email: seedUsers.user1.email });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('always returns 200 for an unknown email too (no enumeration)', async () => {
      const res = await agent.post('/auth/forgot-password').send({ email: 'ghost@haum.test' });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it('rejects a missing email', async () => {
      const res = await agent.post('/auth/forgot-password').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('rejects a bogus token', async () => {
      const res = await agent.post('/auth/reset-password').send({ token: 'not-a-real-token', password: 'NewPass123' });
      expect(res.status).toBe(400);
    });

    it('rejects a short new password', async () => {
      const res = await agent.post('/auth/reset-password').send({ token: 'whatever', password: '123' });
      expect(res.status).toBe(400);
    });

    it('accepts a valid, unexpired token and rotates the password', async () => {
      const token = 'a-valid-reset-token-for-testing';
      await User.findOneAndUpdate(
        { email: seedUsers.user2.email },
        { resetToken: token, resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) },
      );
      const res = await agent.post('/auth/reset-password').send({ token, password: 'BrandNewPass1' });
      expect(res.status).toBe(200);

      // Old password must no longer work; new one must.
      const oldLogin = await agent.post('/auth/login').send({ email: seedUsers.user2.email, password: SEED_PASSWORD });
      expect(oldLogin.status).toBe(401);
      const newLogin = await agent.post('/auth/login').send({ email: seedUsers.user2.email, password: 'BrandNewPass1' });
      expect(newLogin.status).toBe(200);

      // Restore seed password for any later test relying on it.
      await User.findOneAndUpdate({ email: seedUsers.user2.email }, { passwordHash: (await User.findOne({ email: seedUsers.user1.email })).passwordHash });
    });

    it('rejects an expired token', async () => {
      const token = 'an-expired-reset-token';
      await User.findOneAndUpdate(
        { email: seedUsers.user2.email },
        { resetToken: token, resetTokenExpiry: new Date(Date.now() - 1000) },
      );
      const res = await agent.post('/auth/reset-password').send({ token, password: 'AnotherPass1' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /auth/profile', () => {
    it('requires auth', async () => {
      const res = await agent.put('/auth/profile').send({ name: 'X' });
      expect(res.status).toBe(401);
    });

    it('updates name/phone for the authenticated user', async () => {
      const login = await agent.post('/auth/login').send({ email: seedUsers.user1.email, password: SEED_PASSWORD });
      const res = await agent.put('/auth/profile').set('Cookie', login.headers['set-cookie']).send({ name: 'Seed User One Updated', phone: '+919111111111' });
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Seed User One Updated');
      // restore
      await User.findOneAndUpdate({ email: seedUsers.user1.email }, { name: seedUsers.user1.name, phone: seedUsers.user1.phone });
    });

    it('rejects an empty name', async () => {
      const login = await agent.post('/auth/login').send({ email: seedUsers.user1.email, password: SEED_PASSWORD });
      const res = await agent.put('/auth/profile').set('Cookie', login.headers['set-cookie']).send({ name: '   ' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /auth/password', () => {
    it('requires auth', async () => {
      const res = await agent.put('/auth/password').send({ currentPassword: 'x', newPassword: 'y12345' });
      expect(res.status).toBe(401);
    });

    it('requires the correct current password', async () => {
      const login = await agent.post('/auth/login').send({ email: seedUsers.user1.email, password: SEED_PASSWORD });
      const res = await agent.put('/auth/password').set('Cookie', login.headers['set-cookie']).send({ currentPassword: 'wrong', newPassword: 'NewValid123' });
      expect(res.status).toBe(401);
    });

    it('changes the password given the correct current one, then restores it', async () => {
      const login = await agent.post('/auth/login').send({ email: seedUsers.user1.email, password: SEED_PASSWORD });
      const res = await agent.put('/auth/password').set('Cookie', login.headers['set-cookie']).send({ currentPassword: SEED_PASSWORD, newPassword: 'TempPass123' });
      expect(res.status).toBe(200);

      const reLogin = await agent.post('/auth/login').send({ email: seedUsers.user1.email, password: 'TempPass123' });
      expect(reLogin.status).toBe(200);

      // restore for any later test/file relying on SEED_PASSWORD
      await agent.put('/auth/password').set('Cookie', reLogin.headers['set-cookie']).send({ currentPassword: 'TempPass123', newPassword: SEED_PASSWORD });
    });
  });
});
