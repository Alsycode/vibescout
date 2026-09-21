// FILE: frontend/vitest.setup.ts
// PURPOSE: Per-test-file setup — jest-dom matchers + RTL cleanup.

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
