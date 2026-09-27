import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

function trackConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

for (const path of ['/', '/styleguide']) {
  test(`${path} has one h1, lang en-GB, no axe violations and no console errors`, async ({
    page,
  }) => {
    const errors = trackConsoleErrors(page);
    // networkidle: the dev server may reload once while Vite optimises dependencies.
    await page.goto(path, { waitUntil: 'networkidle' });
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en-GB');

    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual(
      [],
    );
    expect(errors).toEqual([]);
  });
}

test('styleguide screenshot', async ({ page }, info) => {
  await page.goto('/styleguide');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: `screenshots/styleguide-${info.project.name}.png`,
    fullPage: true,
  });
});

test('skip link moves focus to main content', async ({ page }) => {
  await page.goto('/styleguide');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await skip.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});
