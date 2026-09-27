import { describe, expect, it } from 'vitest';
import rehypeTodo from '../../src/lib/rehype-todo';

const p = (text: string) => ({
  type: 'element',
  tagName: 'p',
  children: [{ type: 'text', value: text }],
});

describe('rehypeTodo', () => {
  it('turns a TODO paragraph into a placeholder span', () => {
    const tree = { type: 'root', children: [p('TODO: the site story.')] };
    rehypeTodo()(tree);
    expect(tree.children[0]).toEqual({
      type: 'element',
      tagName: 'p',
      children: [
        {
          type: 'element',
          tagName: 'span',
          properties: {
            className: ['placeholder'],
            title: 'Placeholder: waiting on the club to confirm',
          },
          children: [{ type: 'text', value: '[the site story.]' }],
        },
      ],
    });
  });

  it('leaves other text alone, including a TODO mid-sentence', () => {
    const tree = { type: 'root', children: [p('We planted 40 trees.'), p('Not a TODO: here.')] };
    const before = JSON.stringify(tree);
    rehypeTodo()(tree);
    expect(JSON.stringify(tree)).toBe(before);
  });
});
