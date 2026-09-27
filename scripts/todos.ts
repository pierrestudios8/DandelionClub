/**
 * Lists every `TODO:` placeholder in src/content/ with its file and line.
 * Usage: pnpm todos
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

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
  if (quote !== '"' && quote !== "'") return rest.trim();
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
    if (!/\.(md|mdx|json|ya?ml)$/.test(entry.name)) continue;
    readFileSync(path, 'utf8')
      .split('\n')
      .forEach((content, i) => {
        const at = content.indexOf('TODO:');
        if (at === -1) return;
        todos.push({ file: relative(root, path), line: i + 1, text: quotedValue(content, at) });
      });
  }
  return todos.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const contentDir = fileURLToPath(new URL('../src/content', import.meta.url));
  const todos = findTodos(contentDir);
  for (const t of todos) console.log(`src/content/${t.file}:${t.line}  ${t.text}`);
  console.log(`\n${todos.length} open TODO${todos.length === 1 ? '' : 's'}`);
}
