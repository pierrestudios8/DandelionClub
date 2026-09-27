/** Dates and times as the site writes them: "29 August 2026", "09:00". */
import { isTodo } from './todo';

const UTC = 'UTC';

/**
 * Front-matter dates load as UTC midnight, so format them in UTC to keep the
 * written day the same as the one in the file.
 */
export function formatDate(date: Date, { weekday = false } = {}): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: UTC,
    ...(weekday && { weekday: 'long' }),
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** "09:00 to 12:30", or the first TODO if either end isn't confirmed. */
export function formatTimeRange(start: string, end: string): string {
  if (isTodo(start)) return start;
  if (isTodo(end)) return end;
  return `${start} to ${end}`;
}

const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

/** "Three" for 3, as in "Three sites so far."; digits from 11 up. */
export function numberWord(n: number): string {
  return WORDS[n] ?? String(n);
}

const rand = new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 });

/** "R1 000" (South African grouping, no cents). */
export function formatRand(amount: number): string {
  return `R${rand.format(amount)}`;
}
