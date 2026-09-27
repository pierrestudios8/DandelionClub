import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home page loads with one h1 and no axe violations', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));

  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');

  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
  expect(errors).toEqual([]);
});
