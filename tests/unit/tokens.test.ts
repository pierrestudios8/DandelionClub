import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildCss, readTokens } from '../../scripts/tokens';

const root = fileURLToPath(new URL('../../', import.meta.url));
const tokens = readTokens(root);
const css = buildCss(tokens);

describe('tokens.css generator', () => {
  it('writes every colour token, resolving references', () => {
    for (const c of tokens.color.tokens) {
      const expected = c.value.startsWith('{') ? `var(--${c.value.slice(1, -1)})` : c.value;
      expect(css).toContain(`--${c.name}: ${expected};`);
    }
  });

  it('writes every spacing, radius, border and layout token', () => {
    for (const t of [
      ...tokens.spacing.tokens,
      ...tokens.radius.tokens,
      ...tokens.border.tokens,
      ...tokens.layout.tokens,
    ]) {
      expect(css).toContain(`--${t.name}: ${t.value};`);
    }
  });

  it('writes both font families', () => {
    expect(css).toContain(`--font-display: ${tokens.type.families.display};`);
    expect(css).toContain(`--font-text: ${tokens.type.families.text};`);
  });

  it('writes custom properties and a utility class for every type style', () => {
    for (const group of tokens.type.groups) {
      for (const s of group.styles) {
        expect(css).toContain(`--type-${s.name}-size: ${s.fontSize};`);
        expect(css).toContain(`--type-${s.name}-leading: ${s.lineHeight};`);
        expect(css).toContain(`--type-${s.name}-weight: ${s.fontWeight};`);
        expect(css).toContain(`--type-${s.name}-family: var(--font-${group.family});`);
        expect(css).toContain(`.t-${s.name} {`);
      }
    }
  });

  it('includes the mobile and layout sizes the components rely on', () => {
    for (const name of [
      'display-sm',
      'eyebrow-sm',
      'eyebrow-lg',
      'tag',
      'title-sm',
      'subtitle-sm',
      'small-lg',
    ])
      expect(css).toContain(`.t-${name} {`);
    for (const name of [
      'focus-offset',
      'logo-width',
      'seedband-height',
      'seed-pattern-size',
      'field-measure',
    ])
      expect(css).toContain(`--${name}: `);
  });

  it('sets display styles in capitals by CSS, but not detail', () => {
    const block = (name: string) => css.slice(css.indexOf(`.t-${name} {`)).split('}')[0];
    expect(block('display')).toContain('text-transform: uppercase');
    expect(block('eyebrow')).toContain('text-transform: uppercase');
    expect(block('detail')).not.toContain('text-transform');
    expect(block('lead')).not.toContain('text-transform');
  });

  it('steps display-xl down to display below 1024px', () => {
    expect(css).toMatch(
      /@media \(max-width: 1023px\)[\s\S]*--type-display-xl-size: var\(--type-display-size\)/,
    );
  });
});
