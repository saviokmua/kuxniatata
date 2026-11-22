import { describe, expect, it } from 'vitest';
import { recipeJsonLd } from '../src/lib/jsonld';

const recipe = {
  id: 'borsch',
  data: {
    title: 'Борщ',
    description: 'Опис',
    time: 90,
    servings: 6,
    ingredients: ['Буряк', 'Капуста'],
    cookedOn: new Date('2026-10-12'),
  },
};

describe('recipeJsonLd', () => {
  const ld = recipeJsonLd(recipe, 'https://kuxniatata.pp.ua/img.jpg') as Record<string, unknown>;
  it('is a Recipe', () => {
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Recipe');
  });
  it('uses ISO 8601 duration', () => expect(ld.totalTime).toBe('PT90M'));
  it('lists ingredients', () => expect(ld.recipeIngredient).toEqual(['Буряк', 'Капуста']));
  it('has image, yield and date', () => {
    expect(ld.image).toBe('https://kuxniatata.pp.ua/img.jpg');
    expect(ld.recipeYield).toBe('6');
    expect(ld.datePublished).toBe('2026-10-12');
  });
});
