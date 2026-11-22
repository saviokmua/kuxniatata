import { describe, expect, it } from 'vitest';
import { slugify } from '../src/lib/slug';

describe('slugify', () => {
  it('transliterates Ukrainian', () => {
    expect(slugify('Яблучний пиріг')).toBe('yabluchnyy-pyrih');
  });
  it('strips punctuation and collapses spaces', () => {
    expect(slugify("  Борщ  з  м'ясом! ")).toBe('borshch-z-myasom');
  });
  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });
});
