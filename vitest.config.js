// FILE: vitest.config.js
// PURPOSE: Backend test runner config (vitest + supertest).

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.js'],
    include: ['test/**/*.test.js', 'src/**/*.test.js'],
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
