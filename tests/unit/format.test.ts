import { describe, expect, it } from 'vitest';
import { formatDate, formatTimeRange } from '../../src/lib/format';

describe('formatDate', () => {
  const date = new Date('2026-08-29T00:00:00Z');

  it('writes dates the British way', () => {
    expect(formatDate(date)).toBe('29 August 2026');
  });

  it('adds the weekday when asked', () => {
    expect(formatDate(date, { weekday: true })).toBe('Saturday, 29 August 2026');
  });
});

describe('formatTimeRange', () => {
  it('joins two times', () => {
    expect(formatTimeRange('09:00', '12:30')).toBe('09:00 to 12:30');
  });

  it('passes a TODO through so it renders as a placeholder', () => {
    expect(formatTimeRange('TODO: start time', '12:30')).toBe('TODO: start time');
    expect(formatTimeRange('09:00', 'TODO: end time')).toBe('TODO: end time');
  });
});
