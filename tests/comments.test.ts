import { describe, expect, it } from 'vitest';
import { validateComment } from '../src/lib/comments';

describe('validateComment', () => {
  it('rejects empty and whitespace-only text', () => {
    expect(validateComment('').ok).toBe(false);
    expect(validateComment('   \n ').ok).toBe(false);
  });
  it('rejects text longer than 2000 characters', () => {
    expect(validateComment('a'.repeat(2001)).ok).toBe(false);
  });
  it('accepts exactly 2000 characters', () => {
    expect(validateComment('a'.repeat(2000)).ok).toBe(true);
  });
  it('trims accepted text', () => {
    expect(validateComment('  Смачно! ')).toEqual({ ok: true, body: 'Смачно!' });
  });
});
