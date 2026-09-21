// FILE: test/unit/emailServiceProdGuard.test.js
// PURPOSE: Stage 1.5 grep-sweep finding — sendPasswordResetEmail's "SMTP not
// configured" fallback used to unconditionally console.log a live, unexpired
// reset token/URL. EMAIL_* is a warn-only (not boot-fatal) env var, so a
// misconfigured production deploy could reach this path for real. Proves the
// new guard: throws instead of logging when NODE_ENV=production, keeps the
// console fallback for local/dev/test convenience otherwise.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('nodemailer', () => ({
  default: { createTransport: vi.fn() },
}));

const { sendPasswordResetEmail } = await import('../../src/services/email.service.js');

const ENV_KEYS = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS', 'NODE_ENV'];
let originalEnv;

beforeEach(() => {
  originalEnv = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  delete process.env.EMAIL_HOST;
  delete process.env.EMAIL_USER;
  delete process.env.EMAIL_PASS;
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (originalEnv[k] === undefined) delete process.env[k];
    else process.env[k] = originalEnv[k];
  }
  vi.restoreAllMocks();
});

describe('sendPasswordResetEmail — unconfigured SMTP', () => {
  it('throws instead of logging the reset link when NODE_ENV=production', async () => {
    process.env.NODE_ENV = 'production';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await expect(sendPasswordResetEmail('user@example.com', 'sekret-token')).rejects.toThrow(
      /email is not configured/i,
    );
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('falls back to a console log outside production (dev/test convenience)', async () => {
    process.env.NODE_ENV = 'test';
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const result = await sendPasswordResetEmail('user@example.com', 'sekret-token');

    expect(result).toEqual({ ok: true, devMode: true });
    expect(logSpy).toHaveBeenCalled();
  });
});
