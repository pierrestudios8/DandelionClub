/** "Add to calendar": an .ics file for each upcoming planting whose times are confirmed. */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getEntry } from 'astro:content';
import { atClubTime, buildIcs } from '../../lib/calendar';
import { getUpcomingPlantings, type Planting } from '../../lib/content';
import { isTodo } from '../../lib/todo';

export const getStaticPaths = (async () => {
  const upcoming = await getUpcomingPlantings();
  return upcoming
    .filter((p) => !isTodo(p.data.start) && !isTodo(p.data.end))
    .map((planting) => ({ params: { id: planting.id }, props: { planting } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ planting: Planting }> = async ({ props, site }) => {
  const { planting } = props;
  const siteEntry = await getEntry(planting.data.site);
  const name = siteEntry?.data.name ?? planting.data.site.id;
  const address = siteEntry && !isTodo(siteEntry.data.address) ? siteEntry.data.address : '';
  const url = new URL(`/plantings/${planting.id}`, site).href;
  const ics = buildIcs({
    uid: `${planting.id}@dandelionclub.co.za`,
    start: atClubTime(planting.data.date, planting.data.start),
    end: atClubTime(planting.data.date, planting.data.end),
    summary: `Food forest planting: ${name}`,
    description: `Bring: ${planting.data.bring}\n${url}`,
    location: address ? `${name}, ${address}` : name,
    url,
  });
  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="dandelion-club-${planting.id}.ics"`,
    },
  });
};
