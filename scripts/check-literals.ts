/**
 * Fails when a colour or size is hard-coded in component, layout or page CSS.
 * Values belong in design/tokens.json → src/styles/tokens.css; use the custom properties.
 *
 * Checks CSS files and the <style> blocks and style="" attributes of .astro files under src/.
 * Allowed: 0, unitless numbers, percentages, fr, vw/vh, ms/s, and @media conditions
 * (custom properties can't be used in media queries).
 * Usage: pnpm lint (runs this), or tsx scripts/check-literals.ts
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface Finding {
  file: string;
  line: number;
  match: string;
}

const COLOUR = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|lab|lch)\(/gi;
const SIZE = /(?<![\w-])\d*\.?\d+(?:px|rem|em|pt)\b/gi;

/** Returns [startLine, text] for each CSS region in a file. */
function cssRegions(path: string, source: string): [number, string][] {
  if (path.endsWith('.css')) return [[1, source]];
  const regions: [number, string][] = [];
  const lineAt = (i: number) => source.slice(0, i).split('\n').length;
  for (const m of source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
    regions.push([lineAt(m.index + m[0].indexOf('>') + 1), m[1]]);
  }
  for (const m of source.matchAll(/\sstyle=(["'`{])([\s\S]*?)\1/g)) {
    regions.push([lineAt(m.index), m[2]]);
  }
  return regions;
}

export function checkSource(file: string, source: string): Finding[] {
  const findings: Finding[] = [];
  for (const [start, css] of cssRegions(file, source)) {
    css.split('\n').forEach((text, i) => {
      const code = text.replace(/\/\*.*?\*\//g, '');
      if (/^\s*@media/.test(code)) return;
      for (const re of [COLOUR, SIZE]) {
        for (const m of code.matchAll(re)) findings.push({ file, line: start + i, match: m[0] });
      }
    });
  }
  return findings;
}

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return walk(path);
    return /\.(astro|css)$/.test(e.name) && e.name !== 'tokens.css' ? [path] : [];
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const findings = walk(join(root, 'src')).flatMap((path) =>
    checkSource(relative(root, path), readFileSync(path, 'utf8')),
  );
  for (const f of findings) console.error(`${f.file}:${f.line}  hard-coded value "${f.match}"`);
  if (findings.length) {
    console.error(
      `\n${findings.length} hard-coded value(s). Use a token from src/styles/tokens.css.`,
    );
    process.exit(1);
  }
  console.log('literals: no hard-coded colours or sizes outside tokens.css');
}
