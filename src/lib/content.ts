/**
 * Content helpers for pages and components. Unpublished entries are included in
 * dev and Vercel previews so the club can review them, and left out in production.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { formatDate } from './format';
import { impactFigures, sortPlantings, type ImpactFigures } from './plantings';

export type Planting = CollectionEntry<'plantings'>;
export type Site = CollectionEntry<'sites'>;

export const includeUnpublished = import.meta.env.DEV || process.env.VERCEL_ENV !== 'production';

const visible = <T extends { data: { publish: boolean } }>(entry: T) =>
  includeUnpublished || entry.data.publish;

const warned = new Set<string>();

async function sorted() {
  const result = sortPlantings(await getCollection('plantings'), { includeUnpublished });
  for (const w of result.warnings) {
    if (warned.has(w)) continue;
    warned.add(w);
    console.warn(`[content] ${w}`);
  }
  return result;
}

/** Upcoming plantings, soonest first. */
export async function getUpcomingPlantings(): Promise<Planting[]> {
  return (await sorted()).upcoming;
}

/** The next upcoming planting, or null when none is scheduled. */
export async function getNextPlanting(): Promise<Planting | null> {
  return (await sorted()).upcoming[0] ?? null;
}

/** Held plantings, newest first (including past dates still marked upcoming). */
export async function getPastPlantings(): Promise<Planting[]> {
  return (await sorted()).past;
}

export async function getSites(): Promise<Site[]> {
  return (await getCollection('sites', visible)).sort((a, b) =>
    a.data.name.localeCompare(b.data.name),
  );
}

/** Impact figures; any figure with unconfirmed inputs is null and must be hidden. */
export async function getImpactFigures(): Promise<ImpactFigures> {
  return impactFigures(await getPastPlantings(), await getSites());
}

export async function getProgrammes() {
  return (await getCollection('programmes')).sort((a, b) => a.data.order - b.data.order);
}

export async function getSettings() {
  const entry = await getEntry('settings', 'settings');
  if (!entry) throw new Error('src/content/settings.json is missing');
  return entry.data;
}

/** What the announcement bar needs for the next planting, or undefined for none. */
export async function getAnnouncement() {
  const next = await getNextPlanting();
  if (!next) return undefined;
  const site = await getEntry(next.data.site);
  return {
    date: formatDate(next.data.date),
    site: site?.data.name ?? next.data.site.id,
    href: `/plantings/${next.id}`,
  };
}
