import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { z } from 'astro/zod';
import { orTodo, settingsSchema, time, todo } from '../../src/lib/schema';

describe('todo', () => {
  it('accepts a placeholder that says what is missing', () => {
    expect(todo.safeParse('TODO: price per tree').success).toBe(true);
  });

  it('rejects an empty or misspelt placeholder', () => {
    expect(todo.safeParse('TODO:').success).toBe(false);
    expect(todo.safeParse('todo: price').success).toBe(false);
    expect(todo.safeParse('TBC').success).toBe(false);
  });
});

describe('orTodo', () => {
  const price = orTodo(z.number());

  it('accepts the real value or a placeholder, nothing else', () => {
    expect(price.safeParse(350).success).toBe(true);
    expect(price.safeParse('TODO: price per tree').success).toBe(true);
    expect(price.safeParse('350').success).toBe(false);
  });
});

describe('time', () => {
  it('takes 24-hour HH:MM only', () => {
    expect(time.safeParse('09:00').success).toBe(true);
    expect(time.safeParse('9:00').success).toBe(false);
    expect(time.safeParse('24:00').success).toBe(false);
  });
});

describe('settings.json', () => {
  const settings = JSON.parse(
    readFileSync(new URL('../../src/content/settings.json', import.meta.url), 'utf8'),
  );

  it('matches the settings schema', () => {
    expect(settingsSchema.safeParse(settings).error).toBeUndefined();
  });

  it('keeps the live-site bank details', () => {
    expect(settings.bank).toEqual({
      accountName: 'Business Building Institute NPC',
      bank: 'FNB',
      account: '63122832446',
      branch: '200912',
      swift: 'FIRNZAJJ',
    });
  });

  it('defaults donation amounts to 100, 350 and 1000', () => {
    const { donationAmounts, ...rest } = settings;
    void donationAmounts;
    expect(settingsSchema.parse(rest).donationAmounts.map((d) => d.amount)).toEqual([
      100, 350, 1000,
    ]);
  });
});
