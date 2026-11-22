import { describe, expect, it } from 'vitest';
import { groupByCategory, getTagIndex, type RecipeLike } from '../src/lib/recipes';

const r = (id: string, category: RecipeLike['data']['category'], tags: string[]): RecipeLike => ({
  id,
  data: { category, tags, cookedOn: new Date('2026-01-01') },
});

describe('getTagIndex', () => {
  it('merges tags that differ only by case', () => {
    const idx = getTagIndex([r('a', 'supy', ['Швидко']), r('b', 'deserty', ['швидко'])]);
    expect(idx.size).toBe(1);
    const t = idx.get('shvydko')!;
    expect(t.recipes.map((x) => x.id)).toEqual(['a', 'b']);
  });
  it('handles recipes without tags', () => {
    expect(getTagIndex([r('a', 'supy', [])]).size).toBe(0);
  });
});

describe('groupByCategory', () => {
  it('groups recipes and returns empty arrays for unused categories', () => {
    const g = groupByCategory([r('a', 'supy', []), r('b', 'supy', []), r('c', 'napoi', [])]);
    expect(g.get('supy')!.map((x) => x.id)).toEqual(['a', 'b']);
    expect(g.get('napoi')!.map((x) => x.id)).toEqual(['c']);
    expect(g.get('deserty')).toEqual([]);
  });
});
