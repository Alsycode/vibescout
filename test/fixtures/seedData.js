// FILE: test/fixtures/seedData.js
// PURPOSE: Canonical test fixtures shared by the seed script (test/seed/seedTestData.js)
//          and integration tests. Keep IDs stable — tests reference them by value.

export const SEED_PASSWORD = 'Test1234!';

export const seedUsers = {
  admin: {
    key: 'admin',
    name: 'Seed Admin',
    email: 'admin@haum.test',
    phone: '+919000000000',
    role: 'admin',
  },
  user1: {
    key: 'user1',
    name: 'Seed User One',
    email: 'user1@haum.test',
    phone: '+919000000001',
    role: 'user',
  },
  user2: {
    key: 'user2',
    name: 'Seed User Two',
    email: 'user2@haum.test',
    phone: '+919000000002',
    role: 'user',
  },
};

// sessionId shape mirrors analyze.routes.js: `vs_${Date.now()}_${randomBytes(6).hex}`
export const seedSessions = {
  // Owned by user1, in reportHistory, and unlocked (paid).
  completed: 'vs_1757000000000_0000005eed01',
  // A completed ShadowProperty NOT in any history and NOT unlocked — for paywall tests.
  locked: 'vs_1757000000001_0000005eed02',
};

// crypto.randomBytes(16).toString('hex') — 32 hex chars.
export const seedShareToken = 'deadbeefdeadbeefdeadbeefdeadbeef';

export const seedClusterId = 'seed_cluster_blr_koramangala';
