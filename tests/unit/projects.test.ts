import { describe, expect, it } from 'vitest';
import { activeProjects, plantedTotal, type ProjectLike } from '../../src/lib/projects';

const project = (p: Partial<ProjectLike>): ProjectLike => ({
  active: true,
  order: 1,
  treesTarget: 100,
  phases: [],
  ...p,
});

describe('plantedTotal', () => {
  it('uses the project figure when there are no phases', () => {
    expect(plantedTotal(project({ treesPlanted: 92 }))).toBe(92);
  });

  it('sums the phases', () => {
    const phases = [
      { name: 'Phase 01', treesPlanted: 88 },
      { name: 'Phase 02', treesPlanted: 80 },
      { name: 'Phase 03', treesPlanted: 60 },
    ];
    expect(plantedTotal(project({ phases }))).toBe(228);
  });

  it('stays a placeholder while any phase is unconfirmed', () => {
    const phases = [
      { name: 'Phase 01', treesPlanted: 88 },
      { name: 'Phase 02', treesPlanted: 'TODO: phase 2 count' as const },
    ];
    expect(plantedTotal(project({ phases }))).toBe('TODO: phase 2 count');
  });

  it('is undefined when nothing has been entered', () => {
    expect(plantedTotal(project({}))).toBeUndefined();
  });
});

describe('activeProjects', () => {
  it('keeps active projects only, in their set order', () => {
    const sites = [
      { id: 'c', data: { project: project({ order: 3 }) } },
      { id: 'none', data: {} },
      { id: 'a', data: { project: project({ order: 1 }) } },
      { id: 'off', data: { project: project({ active: false, order: 0 }) } },
      { id: 'b', data: { project: project({ order: 2 }) } },
    ];
    expect(activeProjects(sites).map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });
});
