/**
 * Generates src/styles/tokens.css from design/tokens.json.
 *
 * Phase 0 stub: writes the file header only so `pnpm build` has a step to run.
 * Phase 1 replaces this with the full generator (colour, spacing, radius,
 * border, layout, font and type-style output) and its unit test.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const tokens = JSON.parse(readFileSync(`${root}design/tokens.json`, 'utf8')) as {
  name: string;
  version: number;
};

const css = `/* Generated from design/tokens.json (${tokens.name} v${tokens.version}) by scripts/tokens.ts. Do not edit. */
:root {
}
`;

writeFileSync(`${root}src/styles/tokens.css`, css);
console.log('tokens: wrote src/styles/tokens.css');
