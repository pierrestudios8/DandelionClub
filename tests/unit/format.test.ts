import { describe, expect, it } from 'vitest';
import { formatDate, formatRand, formatTimeRange, numberWord } from '../../src/lib/format';

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

describe('numberWord', () => {
  it('writes small numbers as words and larger ones as digits', () => {
    expect(numberWord(3)).toBe('Three');
    expect(numberWord(1)).toBe('One');
    expect(numberWord(12)).toBe('12');
  });
});

describe('formatRand', () => {
  it('uses South African grouping with no cents', () => {
    expect(formatRand(350)).toBe('R350');
    expect(formatRand(1000)).toBe('R1 000');
  });
});
