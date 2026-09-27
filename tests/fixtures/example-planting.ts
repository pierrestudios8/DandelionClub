/**
 * An all-placeholder upcoming planting for e2e tests and local checks of the
 * designed Planting detail page, which needs an upcoming planting to render.
 * Loaded only when DC_FIXTURES is set (Playwright and the local preview);
 * never on Vercel, so no one mistakes it for a real date.
 */

/** The Saturday at least three weeks after `now`, as YYYY-MM-DD. */
export function exampleDate(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 21));
  d.setUTCDate(d.getUTCDate() + ((6 - d.getUTCDay() + 7) % 7));
  return d.toISOString().slice(0, 10);
}

export const EXAMPLE_ID = 'example-upcoming';

export const exampleBody =
  "TODO: two or three sentences on this site: the school, what's there now, and what this planting adds.";

export function examplePlanting(now = new Date()) {
  return {
    title: 'TODO: example planting (tests only)',
    site: 'silukhanyo-primary',
    date: exampleDate(now),
    start: 'TODO: start time',
    end: 'TODO: end time',
    status: 'upcoming',
    summary: "TODO: one line on what we're planting this time",
    kids: 'TODO: welcome with an adult; any age limits or notes',
    access: 'TODO: parking, public transport, step-free access',
    schedule: [
      { time: 'TODO: time', text: 'TODO: arrive, sign in, tea' },
      { time: 'TODO: time', text: 'TODO: a short walk through the plan' },
      { time: 'TODO: time', text: 'TODO: planting in small teams' },
      { time: 'TODO: time', text: 'TODO: mulch, water and a photo with the new trees' },
    ],
    capacity: 40,
    publish: false,
  };
}
