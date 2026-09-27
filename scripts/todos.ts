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
        const match = /TODO:[^"\n]*/.exec(content);
        if (!match) return;
        todos.push({ file: relative(root, path), line: i + 1, text: match[0].trim() });
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
