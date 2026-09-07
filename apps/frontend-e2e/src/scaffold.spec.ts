import { test, expect } from '@playwright/test';

test('renders the Roles from the shared module', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('h1')).toHaveText('User Directory');
  await expect(page.getByText('Roles: admin, editor, viewer')).toBeVisible();
});
