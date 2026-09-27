/**
 * Rehype plugin: in Markdown bodies, a paragraph, heading or list item whose text
 * starts with `TODO:` renders as a visible placeholder ("[what's missing]"), the
 * same as the Placeholder component. Other text is left alone.
 */
interface Text {
  type: 'text';
  value: string;
}

interface Element {
  type: 'element';
  tagName: string;
  properties?: Record<string, unknown>;
  children: Node[];
}

type Node = Text | Element | { type: string; children?: Node[] };

const BLOCKS = new Set(['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote']);

function visit(node: Node) {
  if (!('children' in node) || !node.children) return;
  if (node.type === 'element' && BLOCKS.has((node as Element).tagName)) {
    const first = node.children[0];
    if (first?.type === 'text' && /^\s*TODO:\s*\S/.test((first as Text).value)) {
      const label = (first as Text).value.replace(/^\s*TODO:\s*/, '').trim();
      node.children[0] = {
        type: 'element',
        tagName: 'span',
        properties: {
          className: ['placeholder'],
          title: 'Placeholder: waiting on the club to confirm',
        },
        children: [{ type: 'text', value: `[${label}]` }],
      } as Element;
    }
  }
  node.children.forEach(visit);
}

export default function rehypeTodo() {
  return (tree: Node) => visit(tree);
}
