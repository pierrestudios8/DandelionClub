import { expect, test } from '@playwright/test';

test('mobile: menu opens as a dialog, closes on Escape, and returns focus', async ({
  page,
}, info) => {
  test.skip(info.project.name !== 'mobile', 'Menu is for small screens');
  await page.goto('/styleguide');

  const header = page.locator('header.header');
  const toggle = header.getByRole('button', { name: 'Open menu' });
  await expect(header.getByRole('navigation', { name: 'Main' }).first()).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.click();
  const menu = page.getByRole('dialog', { name: 'Menu' });
  await expect(menu).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  for (const name of ['Plantings', 'Our work', 'About', 'Journal', 'Get involved']) {
    await expect(menu.getByRole('link', { name })).toBeVisible();
  }
  await page.screenshot({ path: 'screenshots/menu-mobile.png' });

  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.click();
  await menu.getByRole('button', { name: 'Close menu' }).click();
  await expect(menu).toBeHidden();
});

test('desktop: links are inline and the menu button is hidden', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Inline nav is for wide screens');
  await page.goto('/styleguide');
  const header = page.locator('header.header');
  await expect(header.getByRole('button', { name: 'Open menu' })).toBeHidden();
  for (const name of ['Plantings', 'Our work', 'About', 'Get involved']) {
    await expect(header.getByRole('link', { name, exact: true })).toBeVisible();
  }
  const journal = header.getByRole('link', { name: 'Journal', exact: true });
  await expect(journal).toBeHidden();
  await header.getByRole('link', { name: 'Our work', exact: true }).hover();
  await expect(journal).toBeVisible();
  await header.getByRole('link', { name: 'Get involved', exact: true }).hover();
  await expect(header.getByRole('link', { name: 'Donate', exact: true })).toBeVisible();
});
