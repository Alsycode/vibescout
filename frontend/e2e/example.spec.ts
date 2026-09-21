// FILE: frontend/e2e/example.spec.ts
// Placeholder E2E — real journeys land in Stage 5 (PRODUCTION_READINESS_PLAN.md).
// Run with: npm run test:e2e  (first time: npx playwright install)
import { test, expect } from '@playwright/test';

test('home page responds', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/.+/);
});
