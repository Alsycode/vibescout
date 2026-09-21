// FILE: test/unit/seedData.test.js
import { describe, it, expect } from 'vitest';
import {
  SEED_PASSWORD,
  seedUsers,
  seedSessions,
  seedShareToken,
  seedClusterId,
} from '../fixtures/seedData.js';

const SESSION_RE = /^vs_\d{13}_[0-9a-f]{12}$/;

describe('seed fixtures', () => {
  it('has exactly one admin and two normal users with distinct emails', () => {
    const roles = Object.values(seedUsers).map((u) => u.role);
    expect(roles.filter((r) => r === 'admin')).toHaveLength(1);
    expect(roles.filter((r) => r === 'user')).toHaveLength(2);
    const emails = Object.values(seedUsers).map((u) => u.email);
    expect(new Set(emails).size).toBe(emails.length);
  });

  it('session ids match the analyze.routes.js shape', () => {
    expect(seedSessions.completed).toMatch(SESSION_RE);
    expect(seedSessions.locked).toMatch(SESSION_RE);
    expect(seedSessions.completed).not.toBe(seedSessions.locked);
  });

  it('share token is 32 hex chars', () => {
    expect(seedShareToken).toMatch(/^[0-9a-f]{32}$/);
  });

  it('exposes a password and a cluster id', () => {
    expect(SEED_PASSWORD.length).toBeGreaterThanOrEqual(8);
    expect(seedClusterId).toBeTruthy();
  });
});
