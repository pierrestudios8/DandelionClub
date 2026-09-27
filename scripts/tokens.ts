/**
 * Generates src/styles/tokens.css from design/tokens.json.
 *
 * Output: colour, spacing, radius, border and layout custom properties,
 * --font-display / --font-text, per-type-style custom properties
 * (--type-<name>-size / -leading / -weight / -family) and one utility class
 * per type style (.t-<name>).
 *
 * A few values appear in the approved page designs (design/pages/*.dc.html)
 * but not in tokens.json. They live in DESIGN_DERIVED below, so tokens.css
 * stays the only place a raw value is written. See docs/DECISIONS.md.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

interface NamedToken {
  name: string;
  value: string;
}

interface TypeStyle {
  name: string;
  fontSize: string;
  lineHeight: string | number;
  fontWeight: number;
}

export interface Tokens {
  name: string;
  version: number;
  color: { tokens: NamedToken[] };
  type: {
    families: Record<string, string>;
    groups: { name: string; family: string; styles: TypeStyle[] }[];
  };
  spacing: { tokens: NamedToken[] };
  radius: { tokens: NamedToken[] };
  border: { tokens: NamedToken[] };
  layout: { tokens: NamedToken[] };
}

/** Sizes taken from the approved page designs that tokens.json doesn't carry. */
export const DESIGN_DERIVED = {
  type: [
    // Mobile section headlines (HomeMobile, PlantingDetailMobile).
    {
      name: 'display-sm',
      family: 'display',
      fontSize: '32px',
      lineHeight: '30px',
      fontWeight: 900,
    },
    // Eyebrows under 600px, route-card kickers, footer headings.
    {
      name: 'eyebrow-sm',
      family: 'display',
      fontSize: '14px',
      lineHeight: '18px',
      fontWeight: 900,
    },
    // Route-card titles (GetInvolved).
    {
      name: 'eyebrow-lg',
      family: 'display',
      fontSize: '26px',
      lineHeight: '28px',
      fontWeight: 900,
    },
    // Tags on cards (components.reference.css .dc-tag).
    { name: 'tag', family: 'display', fontSize: '12px', lineHeight: '16px', fontWeight: 900 },
    // Card titles (Plantings past cards, mobile planting card).
    { name: 'title-sm', family: 'text', fontSize: '26px', lineHeight: '32px', fontWeight: 700 },
    // Mobile subtitles (HomeMobile site and programme names).
    { name: 'subtitle-sm', family: 'text', fontSize: '20px', lineHeight: '24px', fontWeight: 700 },
    // Card descriptions, footer links, mobile body.
    { name: 'small-lg', family: 'text', fontSize: '16px', lineHeight: '24px', fontWeight: 400 },
  ] satisfies (TypeStyle & { family: string })[],
  layout: [
    { name: 'focus-offset', value: '3px' },
    { name: 'logo-width', value: '160px' },
    { name: 'logo-height', value: '65px' },
    { name: 'logo-width-sm', value: '128px' },
    { name: 'logo-height-sm', value: '52px' },
    { name: 'seedband-height', value: '390px' },
    { name: 'seedband-height-sm', value: '280px' },
    { name: 'seed-size', value: '150px' },
    { name: 'seed-size-sm', value: '110px' },
    { name: 'seed-pattern-size', value: '144px' },
    { name: 'seed-pattern-size-sm', value: '120px' },
    { name: 'card-measure', value: '560px' },
    { name: 'field-measure', value: '560px' },
  ] satisfies NamedToken[],
};

const toPx = (v: string | number) => (typeof v === 'number' ? String(v) : v);

/** Resolves `{name}` references against the colour list. */
function resolveColour(value: string, colours: NamedToken[]): string {
  const ref = /^\{(.+)\}$/.exec(value);
  if (!ref) return value;
  return `var(--${colours.find((c) => c.name === ref[1])?.name ?? ref[1]})`;
}

function typeVars(style: TypeStyle, family: string): string[] {
  return [
    `  --type-${style.name}-family: var(--font-${family});`,
    `  --type-${style.name}-size: ${style.fontSize};`,
    `  --type-${style.name}-leading: ${toPx(style.lineHeight)};`,
    `  --type-${style.name}-weight: ${style.fontWeight};`,
  ];
}

function typeClass(name: string, family: string): string {
  const caps = family === 'display' && !['detail'].includes(name);
  return [
    `.t-${name} {`,
    `  font-family: var(--type-${name}-family);`,
    `  font-size: var(--type-${name}-size);`,
    `  line-height: var(--type-${name}-leading);`,
    `  font-weight: var(--type-${name}-weight);`,
    ...(caps ? ['  text-transform: uppercase;'] : []),
    '}',
  ].join('\n');
}

/** Points one type style's custom properties at another's. */
function stepTo(from: string, to: string): string[] {
  return ['size', 'leading', 'weight', 'family'].map(
    (p) => `    --type-${from}-${p}: var(--type-${to}-${p});`,
  );
}

export function buildCss(tokens: Tokens): string {
  const colours = tokens.color.tokens;
  const styles = tokens.type.groups.flatMap((g) =>
    g.styles.map((s) => ({ ...s, family: g.family })),
  );
  const allStyles = [...styles, ...DESIGN_DERIVED.type];

  const root = [
    '  /* colour */',
    ...colours.map((c) => `  --${c.name}: ${resolveColour(c.value, colours)};`),
    '',
    '  /* font families */',
    ...Object.entries(tokens.type.families).map(([k, v]) => `  --font-${k}: ${v};`),
    '',
    '  /* spacing */',
    ...tokens.spacing.tokens.map((t) => `  --${t.name}: ${t.value};`),
    '',
    '  /* radius and border */',
    ...tokens.radius.tokens.map((t) => `  --${t.name}: ${t.value};`),
    ...tokens.border.tokens.map((t) => `  --${t.name}: ${t.value};`),
    '',
    '  /* layout */',
    ...tokens.layout.tokens.map((t) => `  --${t.name}: ${t.value};`),
    '',
    '  /* type styles */',
    ...styles.flatMap((s) => typeVars(s, s.family)),
    '',
    '  /* from the approved page designs, not in tokens.json */',
    ...DESIGN_DERIVED.type.flatMap((s) => typeVars(s, s.family)),
    ...DESIGN_DERIVED.layout.map((t) => `  --${t.name}: ${t.value};`),
  ];

  return [
    `/* Generated from design/tokens.json (${tokens.name} v${tokens.version}) by scripts/tokens.ts. Do not edit. */`,
    '',
    ':root {',
    ...root,
    '}',
    '',
    '/* display-xl is desktop-only; it steps down to display below 1024px. */',
    '@media (max-width: 1023px) {',
    '  :root {',
    ...stepTo('display-xl', 'display'),
    '  }',
    '}',
    '',
    '/* Under 600px eyebrows take the mobile size from the approved designs. */',
    '@media (max-width: 599px) {',
    '  :root {',
    ...stepTo('eyebrow', 'eyebrow-sm'),
    '  }',
    '}',
    '',
    ...allStyles.map((s) => typeClass(s.name, s.family)),
    '',
  ].join('\n');
}

export function readTokens(root: string): Tokens {
  return JSON.parse(readFileSync(`${root}design/tokens.json`, 'utf8')) as Tokens;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('..', import.meta.url));
  writeFileSync(`${root}src/styles/tokens.css`, buildCss(readTokens(root)));
  console.log('tokens: wrote src/styles/tokens.css');
}
