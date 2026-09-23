// FILE: test/integration/helpers.js
// PURPOSE: Shared setup for Stage 3 API integration tests — real test-DB
//          connect/seed, a supertest agent, and fast cookie builders that
//          mint JWTs directly (bypassing bcrypt/login) for authz-only tests.

import request from 'supertest';
import app from '../../src/app.js';
import { connectTestDb, disconnectTestDb } from '../helpers/db.js';
import { seedTestData } from '../seed/seedTestData.js';
import { signToken, signAdminToken } from '../../src/services/token.service.js';

export const agent = request(app);

export async function setupDb() {
  await connectTestDb();
  return seedTestData({ fresh: true });
}

export async function teardownDb() {
  await disconnectTestDb();
}

export function sessionCookieFor(user) {
  const token = signToken({ userId: user._id, email: user.email, name: user.name, role: user.role });
  return `vb_session=${token}`;
}

export function adminCookieFor(user) {
  const token = signAdminToken({ userId: user._id, email: user.email, name: user.name, role: user.role });
  return `vb_admin_session=${token}`;
}

// Mints an admin-audience token for a NON-admin role — only reachable by
// crafting the token directly (the real /admin/auth/login route refuses to
// sign one for a non-admin user), used to exercise requireAdminAuth's
// defensive `decoded.role !== 'admin'` branch.
export function forgedAdminCookieFor(user) {
  const token = signAdminToken({ userId: user._id, email: user.email, name: user.name, role: 'user' });
  return `vb_admin_session=${token}`;
}
