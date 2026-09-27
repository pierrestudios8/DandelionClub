/**
 * Generates src/styles/tokens.css from design/tokens.json.
 *
 * Output: colour, spacing, radius, border and layout custom properties,
 * --font-display / --font-text, per-type-style custom properties
 * (--type-<name>-size / -leading / -weight / -family) and one utility class
 * per type style (.t-<name>).
 *
 * design/tokens.json (v2 onwards) holds every value, including the mobile and
 * layout sizes the approved page designs use.
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
    ...styles.map((s) => typeClass(s.name, s.family)),
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
