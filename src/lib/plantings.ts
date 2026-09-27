/**
 * Pure planting logic: upcoming vs past, the next planting, impact figures.
 * `content.ts` feeds these from the collections; tests feed them directly.
 */
import { isTodo } from './todo';

export const TIME_ZONE = 'Africa/Johannesburg';

type Status = 'upcoming' | 'done' | 'cancelled';

export interface PlantingLike {
  id: string;
  data: {
    date: Date;
    status: Status;
    publish: boolean;
    site: { id: string };
    treesPlanted?: number | string;
    volunteers?: number | string;
  };
}

export interface SiteLike {
  id: string;
  data: { publish: boolean };
}

export interface Options {
  now?: Date;
  /** Include `publish: false` entries (dev and previews). */
  includeUnpublished?: boolean;
}

export interface SortedPlantings<P extends PlantingLike> {
  /** Soonest first. Only `upcoming` entries dated today or later. */
  upcoming: P[];
  /** Newest first. `done` entries, plus `upcoming` ones whose date has passed. */
  past: P[];
  /** Human-readable problems for the build log. */
  warnings: string[];
}

/** "2026-08-29" for a date as the club's calendar sees it. */
export function localDay(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Front-matter dates (`date: 2026-08-29`) load as UTC midnight, so read their
 * calendar day in UTC, not in the local zone.
 */
function plantingDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function sortPlantings<P extends PlantingLike>(
  entries: P[],
  { now = new Date(), includeUnpublished = false }: Options = {},
): SortedPlantings<P> {
  const today = localDay(now);
  const upcoming: P[] = [];
  const past: P[] = [];
  const warnings: string[] = [];

  for (const entry of entries) {
    if (!entry.data.publish && !includeUnpublished) continue;
    const day = plantingDay(entry.data.date);
    const { status } = entry.data;

    if (status === 'cancelled') continue;
    if (status === 'done') {
      if (day > today) {
        warnings.push(
          `Planting "${entry.id}" is marked done but its date ${day} is in the future.`,
        );
      }
      past.push(entry);
      continue;
    }
    if (day >= today) {
      upcoming.push(entry);
    } else {
      warnings.push(
        `Planting "${entry.id}" (${day}) is still marked upcoming but its date has passed; ` +
          'showing it as done. Set status: done and add the counts.',
      );
      past.push(entry);
    }
  }

  const byDate = (a: P, b: P) => a.data.date.getTime() - b.data.date.getTime();
  upcoming.sort(byDate);
  past.sort((a, b) => byDate(b, a));
  return { upcoming, past, warnings };
}

export interface ImpactFigures {
  treesPlanted: number | null;
  plantingsHeld: number | null;
  schools: number | null;
  volunteers: number | null;
}

/** Sums a count across plantings, or null if any input is missing or a TODO. */
function sumOrNull(plantings: PlantingLike[], key: 'volunteers'): number | null {
  if (plantings.length === 0) return null;
  let total = 0;
  for (const p of plantings) {
    const value = p.data[key];
    if (typeof value !== 'number' || isTodo(value)) return null;
    total += value;
  }
  return total;
}

/**
 * Figures for the impact strip (docs/SPEC.md, Derived figures). Trees planted is
 * the active projects' total (`projectTreesTotal`, passed in); the other figures
 * come from held plantings. A figure is null until every input is real; with no
 * plantings held, the planting figures are null.
 */
export function impactFigures(
  held: PlantingLike[],
  sites: SiteLike[],
  projectTrees: number | null,
): ImpactFigures {
  if (held.length === 0) {
    return { treesPlanted: projectTrees, plantingsHeld: null, schools: null, volunteers: null };
  }
  const siteIds = new Set(sites.map((s) => s.id));
  const sitesWithPlanting = new Set(
    held.map((p) => p.data.site.id).filter((id) => siteIds.has(id)),
  );
  return {
    treesPlanted: projectTrees,
    plantingsHeld: held.length,
    schools: sitesWithPlanting.size,
    volunteers: sumOrNull(held, 'volunteers'),
  };
}
