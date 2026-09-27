/**
 * Content collections (docs/SPEC.md, Content model).
 * Any field may hold a `TODO:` placeholder where the fact isn't confirmed yet;
 * `pnpm todos` lists them and Placeholder renders them visibly.
 */
import { defineCollection, reference } from 'astro:content';
import { glob, type Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import settingsJson from './content/settings.json';
import { isTodo } from './lib/todo';
import { EXAMPLE_ID, exampleBody, examplePlanting } from '../tests/fixtures/example-planting';
import {
  DEFAULT_BRING,
  calendarDate,
  journalTag,
  location,
  orTodo,
  plantingStatus,
  settingsSchema,
  time,
  url,
} from './lib/schema';

const markdown = (dir: string) => glob({ pattern: '**/*.md', base: `./src/content/${dir}` });

/**
 * Plantings from Markdown, plus the example upcoming planting from
 * tests/fixtures when DC_FIXTURES is set (e2e tests and the local preview only).
 */
function plantingsLoader(): Loader {
  const files = markdown('plantings');
  return {
    name: 'plantings',
    load: async (context) => {
      await files.load(context);
      if (!process.env.DC_FIXTURES) return;
      const data = await context.parseData({ id: EXAMPLE_ID, data: examplePlanting() });
      context.store.set({
        id: EXAMPLE_ID,
        data,
        body: exampleBody,
        rendered: await context.renderMarkdown(exampleBody),
      });
    },
  };
}

/** One Markdown file per planting; the body is "about this planting". */
const plantings = defineCollection({
  loader: plantingsLoader(),
  schema: ({ image }) =>
    z.object({
      title: orTodo(z.string()),
      site: reference('sites'),
      date: calendarDate,
      start: orTodo(time),
      end: orTodo(time),
      status: plantingStatus,
      summary: orTodo(z.string()),
      bring: z.string().default(DEFAULT_BRING),
      kids: orTodo(z.string()),
      access: orTodo(z.string()),
      schedule: z.array(z.object({ time: orTodo(time), text: orTodo(z.string()) })).default([]),
      /** The "[N] spots left" counter appears only when this is set. */
      capacity: z.number().int().positive().optional(),
      heroImage: image().optional(),
      publish: z.boolean(),
      // After the day
      treesPlanted: orTodo(z.number().int().nonnegative()).optional(),
      volunteers: orTodo(z.number().int().nonnegative()).optional(),
      recap: orTodo(z.string()).optional(),
      gallery: z.array(image()).default([]),
    }),
});

/** The body is the site story. */
const sites = defineCollection({
  loader: markdown('sites'),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      slug: z.string(),
      area: orTodo(z.string()),
      address: orTodo(z.string()),
      mapUrl: orTodo(url),
      location: orTodo(location),
      summary: orTodo(z.string()),
      partners: z.array(reference('partners')).default([]),
      heroImage: image().optional(),
      gallery: z.array(image()).default([]),
      publish: z.boolean(),
    }),
});

/** The body is the longer description for Our work. */
const programmes = defineCollection({
  loader: markdown('programmes'),
  schema: z.object({
    title: z.string(),
    summary: orTodo(z.string()),
    order: z.number().int(),
  }),
});

const journal = defineCollection({
  loader: markdown('journal'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: calendarDate,
      author: orTodo(z.string()),
      tags: z.array(journalTag).min(1),
      heroImage: image().optional(),
      related: z.array(z.union([reference('sites'), reference('plantings')])).default([]),
    }),
});

const partners = defineCollection({
  loader: glob({ pattern: '**/*.{md,json}', base: './src/content/partners' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      logo: image().optional(),
      url: orTodo(url).optional(),
      site: reference('sites').optional(),
      publish: z.boolean(),
    }),
});

/** Fact band. A fact renders only once `sourceUrl` is a real link. */
const facts = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/facts' }),
  schema: z.object({
    text: z.string(),
    sourceUrl: orTodo(url),
  }),
});

/**
 * Site-wide settings: one entry, id "settings", from settings.json.
 * With DC_FIXTURES (tests and the local preview only) an unconfirmed tree price
 * becomes the design's example R350 so the live total can be exercised.
 */
const fixtureSettings =
  process.env.DC_FIXTURES && isTodo(settingsJson.treePrice) ? { treePrice: 350 } : {};
const settings = defineCollection({
  loader: () => [{ id: 'settings', ...settingsJson, ...fixtureSettings }],
  schema: settingsSchema,
});

export const collections = { plantings, sites, programmes, journal, partners, facts, settings };
