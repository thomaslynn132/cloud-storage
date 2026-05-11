import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText(/login/i);
  });
});
