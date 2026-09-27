/**
 * Pure project logic: a site's trees planted against its target.
 * `content.ts` feeds these from the sites collection; tests feed them directly.
 */
import { isTodo } from './todo';

/** A count, or a `TODO:` placeholder string (content schemas type these as string). */
type Count = number | string;

export interface Phase {
  name: string;
  treesPlanted: Count;
}

export interface ProjectLike {
  active: boolean;
  order: number;
  treesTarget: Count;
  treesPlanted?: Count;
  phases: Phase[];
}

/**
 * Trees planted so far. With phases, the sum of the phases (a placeholder if any
 * phase is unconfirmed); without, the project's own figure.
 */
export function plantedTotal(project: ProjectLike): Count | undefined {
  if (project.phases.length === 0) return project.treesPlanted;
  let total = 0;
  for (const phase of project.phases) {
    if (typeof phase.treesPlanted !== 'number') {
      return isTodo(phase.treesPlanted)
        ? phase.treesPlanted
        : `TODO: trees planted in ${phase.name}`;
    }
    total += phase.treesPlanted;
  }
  return total;
}

/**
 * Trees planted across projects (the impact figure), or null when there are no
 * projects or any project's count isn't confirmed yet: a partial sum would
 * understate the work.
 */
export function projectTreesTotal(projects: ProjectLike[]): number | null {
  if (projects.length === 0) return null;
  let total = 0;
  for (const project of projects) {
    const planted = plantedTotal(project);
    if (typeof planted !== 'number') return null;
    total += planted;
  }
  return total;
}

/**
 * Whether a project's card can show in production before its site page is
 * published: every figure on the card (area, target, trees planted, each phase)
 * is confirmed, so the card carries no placeholders.
 */
export function projectConfirmed(area: string, project: ProjectLike): boolean {
  const confirmed = (v: unknown) => typeof v === 'number' || (typeof v === 'string' && !isTodo(v));
  return (
    confirmed(area) &&
    typeof project.treesTarget === 'number' &&
    typeof plantedTotal(project) === 'number' &&
    project.phases.every((phase) => typeof phase.treesPlanted === 'number')
  );
}

/** Active projects, in their set order. */
export function activeProjects<S extends { data: { project?: ProjectLike } }>(sites: S[]): S[] {
  const order = (s: S) => s.data.project?.order ?? 0;
  return sites.filter((s) => s.data.project?.active === true).sort((a, b) => order(a) - order(b));
}
