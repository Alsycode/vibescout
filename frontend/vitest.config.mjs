// FILE: frontend/vitest.config.mjs
// PURPOSE: Frontend unit-test runner (vitest + @testing-library/react, jsdom).
//          Playwright E2E lives in ./e2e and is excluded here.

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      reporter: ['text', 'html', 'lcov'],
      include: ['lib/**', 'components/**', 'hooks/**'],
      exclude: ['**/*.test.{ts,tsx}', 'e2e/**'],
    },
  },
});
