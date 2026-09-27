import { describe, expect, it } from 'vitest';
import { clampTrees, treeTotal } from '../../src/lib/trees';

describe('clampTrees', () => {
  it('keeps the count between 1 and 50 whole trees', () => {
    expect(clampTrees(0)).toBe(1);
    expect(clampTrees(51)).toBe(50);
    expect(clampTrees(3.4)).toBe(3);
    expect(clampTrees(Number.NaN)).toBe(1);
  });
});

describe('treeTotal', () => {
  it('multiplies price by the clamped count', () => {
    expect(treeTotal(350, 3)).toBe(1050);
    expect(treeTotal(350, 80)).toBe(17500);
  });
});
