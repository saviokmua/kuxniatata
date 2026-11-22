import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getAllRecipes } from '../lib/collection';

export async function GET(context: APIContext) {
  const recipes = await getAllRecipes();
  return rss({
    title: 'Кухня тата',
    description: 'Рецепти, які я приготував і перевірив на власній кухні.',
    site: context.site!,
    customData: '<language>uk</language>',
    items: recipes.map((recipe) => ({
      title: recipe.data.title,
      description: recipe.data.description,
      pubDate: recipe.data.cookedOn,
      link: `/recipes/${recipe.id}/`,
    })),
  });
}
