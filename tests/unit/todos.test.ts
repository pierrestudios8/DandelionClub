import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findTodos } from '../../scripts/todos';

describe('findTodos', () => {
  it('finds TODO: values in content files with file and line', () => {
    const dir = mkdtempSync(join(tmpdir(), 'todos-'));
    mkdirSync(join(dir, 'plantings'));
    writeFileSync(
      join(dir, 'plantings', 'silukhanyo.md'),
      '---\ntitle: Silukhanyo\ntreesPlanted: "TODO: trees planted"\n---\n',
    );
    writeFileSync(join(dir, 'settings.json'), '{\n  "treePrice": "TODO: price per tree",\n}\n');
    writeFileSync(join(dir, 'notes.txt'), 'TODO: not content');

    expect(findTodos(dir)).toEqual([
      { file: 'plantings/silukhanyo.md', line: 3, text: 'TODO: trees planted' },
      { file: 'settings.json', line: 2, text: 'TODO: price per tree' },
    ]);
  });

  it('returns nothing for an empty folder', () => {
    expect(findTodos(mkdtempSync(join(tmpdir(), 'todos-')))).toEqual([]);
  });
});
