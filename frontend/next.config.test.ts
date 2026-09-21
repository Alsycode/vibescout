// FILE: frontend/next.config.test.ts
// PURPOSE: SEC-07 — regression guard against the image optimizer becoming an
// open proxy again. `images.remotePatterns` must never contain a wildcard
// hostname (`'**'`, or a bare `'*'`) — every next/image usage in this app
// references local /public assets; remote images (news thumbnails, blog
// covers, placeholders) are all plain <img>, which this config can't affect.

import { describe, it, expect } from 'vitest';
import nextConfig from './next.config.js';

describe('next.config.js images.remotePatterns — SEC-07', () => {
  it('has no remote patterns configured (nothing in the app needs one today)', () => {
    expect(nextConfig.images.remotePatterns).toEqual([]);
  });

  it('never contains a wildcard hostname, even if a host is added later', () => {
    const hostnames = nextConfig.images.remotePatterns.map((p: { hostname: string }) => p.hostname);
    expect(hostnames).not.toContain('**');
    expect(hostnames).not.toContain('*');
  });
});
