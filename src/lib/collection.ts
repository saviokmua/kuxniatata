import { getCollection, type CollectionEntry } from 'astro:content';

export type RecipeEntry = CollectionEntry<'recipes'>;

export async function getAllRecipes(): Promise<RecipeEntry[]> {
  const recipes = await getCollection('recipes');
  return recipes.sort((a, b) => b.data.cookedOn.getTime() - a.data.cookedOn.getTime());
}
