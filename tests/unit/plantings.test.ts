import { describe, expect, it } from 'vitest';
import { impactFigures, localDay, sortPlantings, type PlantingLike } from '../../src/lib/plantings';

type Data = PlantingLike['data'];

const planting = (id: string, date: string, over: Partial<Data> = {}): PlantingLike => ({
  id,
  data: {
    date: new Date(`${date}T00:00:00Z`), // how front matter loads
    status: 'upcoming',
    publish: true,
    site: { id: 'silukhanyo-primary' },
    ...over,
  },
});

const sites = [
  { id: 'silukhanyo-primary', data: { publish: true } },
  { id: 'genadendal', data: { publish: true } },
];

// 10:00 on 26 September 2026 in Cape Town.
const now = new Date('2026-09-26T08:00:00Z');

describe('sortPlantings', () => {
  it('returns nothing upcoming and no next planting when none are scheduled', () => {
    const { upcoming, past, warnings } = sortPlantings(
      [planting('a', '2026-08-29', { status: 'done' })],
      { now },
    );
    expect(upcoming).toEqual([]);
    expect(upcoming[0] ?? null).toBeNull();
    expect(past.map((p) => p.id)).toEqual(['a']);
    expect(warnings).toEqual([]);
  });

  it('handles an empty collection', () => {
    expect(sortPlantings([], { now })).toEqual({ upcoming: [], past: [], warnings: [] });
  });

  it('sorts upcoming soonest first and past newest first', () => {
    const { upcoming, past } = sortPlantings(
      [
        planting('later', '2026-11-14'),
        planting('sooner', '2026-10-10'),
        planting('old', '2026-06-01', { status: 'done' }),
        planting('recent', '2026-08-29', { status: 'done' }),
      ],
      { now },
    );
    expect(upcoming.map((p) => p.id)).toEqual(['sooner', 'later']);
    expect(past.map((p) => p.id)).toEqual(['recent', 'old']);
  });

  it('treats a past date still marked upcoming as done, and warns', () => {
    const { upcoming, past, warnings } = sortPlantings([planting('stale', '2026-09-19')], { now });
    expect(upcoming).toEqual([]);
    expect(past.map((p) => p.id)).toEqual(['stale']);
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('"stale"');
    expect(warnings[0]).toContain('still marked upcoming');
  });

  it("keeps today's planting upcoming for the whole day in Cape Town", () => {
    const entries = [planting('today', '2026-09-26')];
    // 23:30 in Cape Town (21:30 UTC) is still the 26th.
    expect(sortPlantings(entries, { now: new Date('2026-09-26T21:30:00Z') }).upcoming).toHaveLength(
      1,
    );
    // 00:30 on the 27th in Cape Town (22:30 UTC on the 26th) is the next day.
    const next = sortPlantings(entries, { now: new Date('2026-09-26T22:30:00Z') });
    expect(next.upcoming).toEqual([]);
    expect(next.warnings).toHaveLength(1);
  });

  it('leaves out cancelled plantings', () => {
    const { upcoming, past } = sortPlantings(
      [
        planting('off', '2026-10-10', { status: 'cancelled' }),
        planting('off-past', '2026-08-01', { status: 'cancelled' }),
      ],
      { now },
    );
    expect(upcoming).toEqual([]);
    expect(past).toEqual([]);
  });

  it('leaves out unpublished plantings unless asked to include them', () => {
    const entries = [planting('draft', '2026-10-10', { publish: false })];
    expect(sortPlantings(entries, { now }).upcoming).toEqual([]);
    expect(sortPlantings(entries, { now, includeUnpublished: true }).upcoming).toHaveLength(1);
  });

  it('warns when a done planting is dated in the future', () => {
    const { past, warnings } = sortPlantings(
      [planting('early', '2026-10-10', { status: 'done' })],
      { now },
    );
    expect(past).toHaveLength(1);
    expect(warnings[0]).toContain('marked done');
  });
});

describe('impactFigures', () => {
  it('returns null for every figure when nothing has been held', () => {
    expect(impactFigures([], sites)).toEqual({
      treesPlanted: null,
      plantingsHeld: null,
      schools: null,
      volunteers: null,
    });
  });

  it('sums real counts and counts sites with at least one held planting', () => {
    const held = [
      planting('a', '2026-08-29', { status: 'done', treesPlanted: 40, volunteers: 25 }),
      planting('b', '2026-09-12', { status: 'done', treesPlanted: 30, volunteers: 12 }),
      planting('c', '2026-09-19', {
        status: 'done',
        treesPlanted: 10,
        volunteers: 8,
        site: { id: 'genadendal' },
      }),
    ];
    expect(impactFigures(held, sites)).toEqual({
      treesPlanted: 80,
      plantingsHeld: 3,
      schools: 2,
      volunteers: 45,
    });
  });

  it('hides a sum when any input is a TODO or missing, but keeps the counts', () => {
    const held = [
      planting('a', '2026-08-29', {
        status: 'done',
        treesPlanted: 'TODO: trees planted',
        volunteers: 25,
      }),
      planting('b', '2026-09-12', { status: 'done', treesPlanted: 30 }),
    ];
    expect(impactFigures(held, sites)).toEqual({
      treesPlanted: null,
      plantingsHeld: 2,
      schools: 1,
      volunteers: null,
    });
  });

  it("doesn't count a site that isn't visible", () => {
    const held = [planting('a', '2026-08-29', { status: 'done', site: { id: 'hidden' } })];
    expect(impactFigures(held, sites).schools).toBe(0);
  });
});

describe('localDay', () => {
  it('reads the calendar day in Cape Town', () => {
    expect(localDay(new Date('2026-09-26T22:30:00Z'))).toBe('2026-09-27');
  });
});
