import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PAGES, PHASE_4_ROUTES } from './pages';

for (const [name, path] of Object.entries(PAGES)) {
  test(`${name}: one h1, no axe violations, no console errors`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));

    const response = await page.goto(path, { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);

    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual(
      [],
    );
    expect(errors).toEqual([]);

    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `screenshots/${name}-${info.project.name}.png`, fullPage: true });
  });
}

test('every internal link resolves (Phase 4 routes excepted)', async ({ page, request }, info) => {
  test.skip(info.project.name !== 'desktop', 'Links are the same at every width');
  const checked = new Map<string, number>();
  const missingAnchors: string[] = [];

  for (const path of Object.values(PAGES)) {
    await page.goto(path);
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href') ?? ''));
    for (const href of hrefs) {
      if (/^(mailto:|tel:|https?:)/.test(href)) continue;
      const url = new URL(href, `http://x${path}`);
      if (url.hash && url.pathname === new URL(`http://x${path}`).pathname) {
        const id = decodeURIComponent(url.hash.slice(1));
        if ((await page.locator(`[id="${id}"]`).count()) === 0)
          missingAnchors.push(`${path} → ${href}`);
        continue;
      }
      if (PHASE_4_ROUTES.some((r) => r.test(url.pathname)) || checked.has(url.pathname)) continue;
      checked.set(url.pathname, (await request.get(url.pathname)).status());
    }
  }
  const broken = [...checked].filter(([, status]) => status !== 200);
  expect(broken).toEqual([]);
  expect(missingAnchors).toEqual([]);
  expect(checked.size).toBeGreaterThan(5);
});

test.describe('planting sign-up', () => {
  test('shows written errors on the fields that need fixing', async ({ page }) => {
    await page.goto(PAGES['planting-upcoming']);
    const form = page.locator('#planting-signup');
    await form.getByRole('button', { name: 'Save my spot', exact: true }).click();

    const name = form.getByLabel('Your name', { exact: true });
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#signup-name-error')).toHaveText('Enter your name.');
    await expect(page.locator('#signup-email-error')).toHaveText(
      'Enter a full email address, like name@example.com.',
    );
    await expect(page.locator('#signup-consent-error')).toBeVisible();
    await expect(form.getByLabel('Mobile number (optional)')).not.toHaveAttribute('aria-invalid');

    await form.getByLabel('Email', { exact: true }).fill('pierre@');
    await form.getByRole('button', { name: 'Save my spot', exact: true }).click();
    await expect(page.locator('#signup-email-error')).toHaveText(
      'Enter a full email address, like name@example.com.',
    );
    await expect(form.getByLabel('Email', { exact: true })).toHaveAttribute(
      'aria-describedby',
      /signup-email-error/,
    );
  });

  test('submits and shows the success message', async ({ page }) => {
    await page.goto(PAGES['planting-upcoming']);
    const form = page.locator('#planting-signup');
    await form.getByLabel('Your name', { exact: true }).fill('Test Person');
    await form.getByLabel('Email', { exact: true }).fill('test@example.com');
    await form.locator('#signup-consent').check();
    await form.getByRole('button', { name: 'Save my spot', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('See you in the soil.');
    await expect(page.locator('#planting-signup')).toBeHidden();
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('planting sign-up posts and lands on the thank-you page', async ({ page }) => {
    await page.goto(PAGES['planting-upcoming']);
    const form = page.locator('#planting-signup');
    await form.getByLabel('Your name', { exact: true }).fill('Test Person');
    await form.getByLabel('Email', { exact: true }).fill('test@example.com');
    await form.locator('#signup-consent').check();
    await form.getByRole('button', { name: 'Save my spot', exact: true }).click();
    await expect(page).toHaveURL(/\/thank-you\/planting$/);
    await expect(page.locator('h1')).toHaveText(/See you in the soil/i);
  });

  test('dedicate a tree works as a plain form', async ({ page }) => {
    await page.goto(PAGES['dedicate-a-tree']);
    await expect(page.getByRole('button', { name: 'One more tree' })).toBeHidden();
    await page.locator('#dedicate-trees').fill('3');
    const form = page.locator('#dedicate');
    await form.getByLabel('Dedicated to', { exact: true }).fill('Gogo');
    await form.getByLabel('Your name', { exact: true }).fill('Test Person');
    await form.getByLabel('Your email', { exact: true }).fill('test@example.com');
    await form.locator('#dedicate-consent').check();
    await page.getByRole('button', { name: 'Continue to payment' }).click();
    await expect(page).toHaveURL(/\/thank-you\/dedication$/);
  });

  test('donate works as a plain form', async ({ page }) => {
    await page.goto(PAGES.donate);
    const form = page.locator('#donate');
    await form.getByText('Monthly', { exact: true }).click();
    await form.getByText('R100', { exact: true }).click();
    await form.getByLabel('Your name', { exact: true }).fill('Test Person');
    await form.getByLabel('Email', { exact: true }).fill('test@example.com');
    await form.locator('#donate-consent').check();
    await page.getByRole('button', { name: 'Continue to payment' }).click();
    await expect(page).toHaveURL(/\/thank-you\/donation$/);
  });
});

test('dedicate: the counter stays within 1 to 50 and the total follows it', async ({ page }) => {
  await page.goto(PAGES['dedicate-a-tree']);
  const trees = page.locator('#dedicate-trees');
  const total = page.locator('[data-total]');
  await expect(total).toHaveText('R350');

  await page.getByRole('button', { name: 'One fewer tree' }).click();
  await expect(trees).toHaveValue('1');

  await page.getByRole('button', { name: 'One more tree' }).click();
  await page.getByRole('button', { name: 'One more tree' }).click();
  await expect(trees).toHaveValue('3');
  await expect(total).toHaveText('R1 050');

  await trees.fill('60');
  await expect(total).toHaveText('R17 500');
  await page.getByRole('button', { name: 'One more tree' }).click();
  await expect(trees).toHaveValue('50');
});

test('donate: the summary follows frequency and amount', async ({ page }) => {
  await page.goto(PAGES.donate);
  const summary = page.locator('[data-donate-summary]');
  await expect(summary.locator('[data-amount]')).toHaveText('R350');
  await expect(summary.locator('[data-frequency]')).toHaveText('Once-off');

  await page.getByText('Monthly', { exact: true }).click();
  await expect(summary.locator('[data-frequency]')).toHaveText('Every month');

  await page.getByText('R100', { exact: true }).click();
  await expect(summary.locator('[data-amount]')).toHaveText('R100');

  await page.locator('#donate-other').fill('500');
  await expect(summary.locator('[data-amount]')).toHaveText('R500');
  await expect(page.locator('input[name="amount"]:checked')).toHaveCount(0);

  await page.getByText('R1 000', { exact: true }).click();
  await expect(page.locator('#donate-other')).toHaveValue('');
  await expect(summary.locator('[data-amount]')).toHaveText('R1 000');
});

test('newsletter sign-up explains a bad email', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('footer');
  await footer.getByLabel('Email address', { exact: true }).fill('nope');
  await footer.getByRole('button', { name: 'Sign up' }).click();
  await expect(footer.locator('#footer-newsletter-email-error')).toHaveText(
    'Enter a full email address, like name@example.com.',
  );
});
