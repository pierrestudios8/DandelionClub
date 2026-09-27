import { describe, expect, it } from 'vitest';
import {
  activeProjects,
  plantedTotal,
  projectConfirmed,
  projectTreesTotal,
  type ProjectLike,
} from '../../src/lib/projects';

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

describe('projectTreesTotal', () => {
  // The three confirmed projects (docs/HANDOFF-2026-09-27.md).
  const silukhanyo = project({ treesTarget: 200, treesPlanted: 92 });
  const silverleaf = project({
    treesTarget: 300,
    phases: [
      { name: 'Phase 01', treesPlanted: 88 },
      { name: 'Phase 02', treesPlanted: 80 },
      { name: 'Phase 03', treesPlanted: 60 },
    ],
  });
  const peacePark = project({ treesTarget: 11, treesPlanted: 11 });

  it('adds up every project, phases included', () => {
    expect(projectTreesTotal([silukhanyo, silverleaf, peacePark])).toBe(331);
  });

  it('is null while any project count is a placeholder, not a partial sum', () => {
    const unconfirmed = project({ treesPlanted: 'TODO: trees planted' });
    expect(projectTreesTotal([silukhanyo, silverleaf, unconfirmed])).toBeNull();
  });

  it('is null while any phase is a placeholder', () => {
    const phased = project({
      phases: [
        { name: 'Phase 01', treesPlanted: 88 },
        { name: 'Phase 02', treesPlanted: 'TODO: phase 2 count' },
      ],
    });
    expect(projectTreesTotal([silukhanyo, phased])).toBeNull();
  });

  it('is null when a project has no count at all, or there are no projects', () => {
    expect(projectTreesTotal([silukhanyo, project({})])).toBeNull();
    expect(projectTreesTotal([])).toBeNull();
  });
});

describe('projectConfirmed', () => {
  it('is true when every figure on the card is real', () => {
    expect(projectConfirmed('Strand', project({ treesTarget: 200, treesPlanted: 92 }))).toBe(true);
    const phases = [
      { name: 'Phase 01', treesPlanted: 88 },
      { name: 'Phase 02', treesPlanted: 80 },
    ];
    expect(projectConfirmed('Dunoon', project({ treesTarget: 300, phases }))).toBe(true);
  });

  it('is false while the area, target, count or any phase is a placeholder', () => {
    const counted = { treesTarget: 200, treesPlanted: 92 };
    expect(projectConfirmed('TODO: area', project(counted))).toBe(false);
    expect(projectConfirmed('Strand', project({ ...counted, treesTarget: 'TODO: target' }))).toBe(
      false,
    );
    expect(projectConfirmed('Strand', project({ treesTarget: 200 }))).toBe(false);
    const phases = [
      { name: 'Phase 01', treesPlanted: 88 },
      { name: 'Phase 02', treesPlanted: 'TODO: phase 2 count' },
    ];
    expect(projectConfirmed('Dunoon', project({ treesTarget: 300, phases }))).toBe(false);
  });
});
