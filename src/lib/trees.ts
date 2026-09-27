/** Tree dedication maths, shared by the page (server render) and its script. */
export const MIN_TREES = 1;
export const MAX_TREES = 50;

export function clampTrees(value: number): number {
  if (!Number.isFinite(value)) return MIN_TREES;
  return Math.min(MAX_TREES, Math.max(MIN_TREES, Math.round(value)));
}

export function treeTotal(price: number, trees: number): number {
  return price * clampTrees(trees);
}
