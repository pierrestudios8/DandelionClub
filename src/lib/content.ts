/**
 * Content helpers for pages and components. Unpublished entries are included in
 * dev and Vercel previews so the club can review them, and left out in production.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { formatDate, formatTimeRange } from './format';
import { isTodo } from './todo';
import { impactFigures, sortPlantings, type ImpactFigures } from './plantings';
import { activeProjects, plantedTotal, projectTreesTotal } from './projects';

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

/** Sites with a held planting first (earliest first), then the rest by name. */
export async function getSites(): Promise<Site[]> {
  const [sites, past] = await Promise.all([getCollection('sites', visible), getPastPlantings()]);
  const firstPlanted = new Map<string, number>();
  for (const p of past) {
    const t = p.data.date.getTime();
    firstPlanted.set(p.data.site.id, Math.min(t, firstPlanted.get(p.data.site.id) ?? t));
  }
  const rank = (s: Site) => firstPlanted.get(s.id) ?? Number.POSITIVE_INFINITY;
  return sites.sort((a, b) => rank(a) - rank(b) || a.data.name.localeCompare(b.data.name));
}

/** Impact figures; any figure with unconfirmed inputs is null and must be hidden. */
export async function getImpactFigures(): Promise<ImpactFigures> {
  const [past, sites] = await Promise.all([getPastPlantings(), getSites()]);
  const projects = activeProjects(sites).flatMap((s) => (s.data.project ? [s.data.project] : []));
  return impactFigures(past, sites, projectTreesTotal(projects));
}

/** What ProjectCard needs for each active project, in order. */
export async function getActiveProjects() {
  return activeProjects(await getSites()).flatMap((site) => {
    const { name, area, project } = site.data;
    if (!project) return [];
    return {
      name,
      area,
      href: `/sites/${site.id}`,
      treesTarget: project.treesTarget,
      treesPlanted: plantedTotal(project),
      phases: project.phases,
      image: site.data.heroImage,
    };
  });
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

/** What PlantingCard and NextPlanting need for one planting. */
export async function plantingCard(planting: Planting) {
  const site = await getEntry(planting.data.site);
  const { data } = planting;
  const siteName = site?.data.name ?? data.site.id;
  const area = site && !isTodo(site.data.area) ? site.data.area : undefined;
  return {
    date: formatDate(data.date, { weekday: true }),
    time: formatTimeRange(data.start, data.end),
    project: data.title,
    location: area ? `${siteName}, ${area}` : siteName,
    href: `/plantings/${planting.id}`,
    treesTarget: data.treesTarget,
    treesDonated: data.treesDonated,
    treesPlanted: data.treesPlanted,
    image: data.heroImage ?? site?.data.heroImage,
  };
}

export async function getFacts() {
  return getCollection('facts');
}

export async function getJournal() {
  return (await getCollection('journal')).sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );
}
