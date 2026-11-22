import { describe, expect, it } from 'vitest';
import { formatTime } from '../src/lib/format';

describe('formatTime', () => {
  it('formats minutes only', () => expect(formatTime(25)).toBe('25 хв'));
  it('formats hours and minutes', () => expect(formatTime(150)).toBe('2 год 30 хв'));
  it('formats whole hours', () => expect(formatTime(120)).toBe('2 год'));
});
