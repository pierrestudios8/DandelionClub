import { expect, test } from '@playwright/test';
import { PAGES } from './pages';

/**
 * CLAUDE.md: no two neighbouring sections share a ground. Walks the page's
 * top-level bands (header, each child of main, footer) and fails when two
 * neighbours have the same background. The header and the first band of main
 * count as one night frame, so that pair isn't compared.
 */

interface Band {
  label: string;
  /** Background at the band's top and bottom edges (they differ for wrappers). */
  top: string;
  bottom: string;
}

for (const [name, path] of Object.entries(PAGES)) {
  test(`${name}: no two neighbouring bands share a ground`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'networkidle' });

    const bands: Band[] = await page.evaluate(() => {
      const bodyBg = getComputedStyle(document.body).backgroundColor;
      const transparent = (c: string) => c === 'transparent' || c === 'rgba(0, 0, 0, 0)';
      const visible = (el: Element) => {
        const r = el.getBoundingClientRect();
        return r.height > 0 && getComputedStyle(el).display !== 'none';
      };
      const label = (el: Element) => {
        const heading = el.querySelector('h1, h2, h3')?.textContent?.trim().slice(0, 40);
        const id = el.id ? `#${el.id}` : '';
        const cls = el.classList.length ? `.${[...el.classList].slice(0, 2).join('.')}` : '';
        return `${el.tagName.toLowerCase()}${id}${cls}${heading ? ` "${heading}"` : ''}`;
      };

      // The colour showing at an element's top or bottom edge: its own background,
      // or for a see-through wrapper, that of its first or last visible child.
      const edge = (el: Element, side: 'top' | 'bottom'): string => {
        const own = getComputedStyle(el).backgroundColor;
        if (!transparent(own)) return own;
        const kids = [...el.children].filter(visible);
        const next = side === 'top' ? kids[0] : kids[kids.length - 1];
        return next ? edge(next, side) : bodyBg;
      };

      const header = document.querySelector('body > header');
      const footer = document.querySelector('body > footer');
      const main = document.querySelector('main');
      const elements = [header, ...(main ? [...main.children] : []), footer].filter(
        (el): el is Element => !!el && visible(el),
      );
      return elements.map((el) => ({
        label: label(el),
        top: edge(el, 'top'),
        bottom: edge(el, 'bottom'),
      }));
    });

    expect(bands.length).toBeGreaterThanOrEqual(3);

    const clashes: string[] = [];
    for (let i = 1; i < bands.length; i++) {
      // Header + first band of main: one night frame.
      if (i === 1 && bands[0].label.startsWith('header')) continue;
      const above = bands[i - 1];
      const below = bands[i];
      if (above.bottom === below.top) {
        clashes.push(`${above.label} → ${below.label} (both ${below.top})`);
      }
    }
    expect(clashes).toEqual([]);
  });
}
