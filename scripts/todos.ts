/**
 * Lists every `TODO:` placeholder with its file and line: content in src/content/,
 * and placeholder copy in pages, components, layouts and form messages.
 * Usage: pnpm todos
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Where placeholders live. The styleguide's sample TODOs are left out on purpose. */
export const SCANNED = [
  'src/content',
  'src/pages',
  'src/components',
  'src/layouts',
  'src/lib/forms',
];

export interface Todo {
  file: string;
  line: number;
  text: string;
}

/**
 * The text from `at` to the end of its quoted value, if it's quoted. YAML writes
 * an apostrophe inside single quotes as '', so a doubled quote doesn't end it.
 */
function quotedValue(line: string, at: number): string {
  const quote = line[at - 1];
  const rest = line.slice(at);
  if (quote !== '"' && quote !== "'" && quote !== '`') return rest.trim();
  let end = 0;
  while (end < rest.length) {
    if (rest[end] === quote) {
      if (quote === "'" && rest[end + 1] === "'") {
        end += 2;
        continue;
      }
      break;
    }
    end += 1;
  }
  const text = rest.slice(0, end);
  return (quote === "'" ? text.replaceAll("''", "'") : text).trim();
}

export function findTodos(dir: string, root = dir): Todo[] {
  const todos: Todo[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      todos.push(...findTodos(path, root));
      continue;
    }
    if (!/\.(md|mdx|json|ya?ml|astro|ts)$/.test(entry.name)) continue;
    readFileSync(path, 'utf8')
      .split('\n')
      .forEach((content, i) => {
        const at = content.indexOf('TODO:');
        if (at === -1) return;
        const text = quotedValue(content, at);
        // A bare mention (e.g. in a doc comment) isn't a placeholder.
        if (!/^TODO:\s*\S/.test(text)) return;
        todos.push({ file: relative(root, path), line: i + 1, text });
      });
  }
  return todos.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const todos = SCANNED.flatMap((dir) => findTodos(join(root, dir), root));
  for (const t of todos) console.log(`${t.file}:${t.line}  ${t.text}`);
  console.log(`\n${todos.length} open TODO${todos.length === 1 ? '' : 's'}`);
}
