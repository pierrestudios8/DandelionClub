import { describe, expect, it } from 'vitest';
import { checkSource } from '../../scripts/check-literals';

describe('check-literals', () => {
  it('flags hex, rgb() and px values inside <style>', () => {
    const source = `---\n---\n<a href="#add">x</a>\n<style>\n  .a { color: #ffcd19; }\n  .b { background: rgba(0, 0, 0, 0.5); }\n  .c { padding: 12px; }\n</style>\n`;
    expect(checkSource('X.astro', source).map((f) => [f.line, f.match])).toEqual([
      [5, '#ffcd19'],
      [6, 'rgba('],
      [7, '12px'],
    ]);
  });

  it('flags literals in style attributes', () => {
    expect(checkSource('X.astro', '<div style="margin: 1rem"></div>')).toHaveLength(1);
  });

  it('allows tokens, unitless numbers, percentages, durations and media queries', () => {
    const source = `<style>\n  .a { padding: var(--space-4); line-height: 1; opacity: 0.45; }\n  .b { width: 100%; transition: color 150ms ease-out; flex: 1 1 0; }\n  @media (min-width: 1024px) { .c { gap: var(--space-7); } }\n  .d { max-width: calc(var(--measure-content) + 2 * var(--space-7)); }\n</style>`;
    expect(checkSource('X.astro', source)).toEqual([]);
  });

  it('ignores hrefs and text outside style blocks', () => {
    expect(checkSource('X.astro', '<a href="#faded">12px wide #fff</a>')).toEqual([]);
  });
});
