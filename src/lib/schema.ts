/**
 * Zod building blocks shared by the content schemas (src/content.config.ts).
 * Kept free of `astro:content` so they can be unit-tested.
 */
import { z } from 'astro/zod';

/** A value the club hasn't confirmed yet, e.g. "TODO: price per tree". */
export const todo = z
  .string()
  .regex(/^TODO:\s*\S/, 'A placeholder must start with "TODO:" and say what is missing');

/** A real value of `schema`, or a `TODO:` placeholder. */
export const orTodo = <T extends z.ZodType>(schema: T) => z.union([schema, todo]);

/** "09:00", 24-hour clock. */
export const time = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Write times as HH:MM, e.g. 09:00');

/** A calendar date from front matter (`date: 2026-08-29`). */
export const calendarDate = z.coerce.date();

export const url = z.url();

export const location = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const plantingStatus = z.enum(['upcoming', 'done', 'cancelled']);

export const journalTag = z.enum(['Plantings', 'Learning', 'Partners', 'Field notes']);

export const DEFAULT_BRING =
  "Gloves if you've got them, a hat, water. We'll bring everything else.";

export const settingsSchema = z.object({
  npcName: z.string(),
  npcRegistration: orTodo(z.string()),
  section18a: orTodo(z.boolean()),
  email: z.email(),
  social: z.object({
    instagram: orTodo(url),
    linkedin: orTodo(url),
  }),
  treePrice: orTodo(z.number().positive()),
  treeIncludes: z.array(z.string()).min(1),
  donationAmounts: z
    .array(z.object({ amount: z.number().positive(), note: z.string() }))
    .min(1)
    .default([
      { amount: 100, note: 'TODO: what R100 buys' },
      { amount: 350, note: 'TODO: what R350 buys' },
      { amount: 1000, note: 'TODO: what R1 000 buys' },
    ]),
  bank: z.object({
    accountName: orTodo(z.string()),
    bank: orTodo(z.string()),
    account: orTodo(z.string()),
    branch: orTodo(z.string()),
    swift: orTodo(z.string()),
  }),
});

export type Settings = z.infer<typeof settingsSchema>;
