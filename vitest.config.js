// FILE: vitest.config.js
// PURPOSE: Backend test runner config (vitest + supertest).

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.test.js', 'src/**/*.test.js'],
    // Stage 3 integration tests do real bcrypt (cost 12) round-trips and hit a
    // real Atlas test DB over the network — both comfortably clear the 5s
    // default on a loaded dev machine but need headroom.
    testTimeout: 15000,
    hookTimeout: 20000,
    // Route/integration tests share a DB and Redis namespace — keep them serial.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.js'],
      exclude: ['src/scripts/**', 'src/jobs/**', 'src/data/**', 'src/**/*.test.js'],
    },
  },
});
