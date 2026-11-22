import { CATEGORY_IDS, type CategoryId } from './categories';
import { slugify } from './slug';

export interface RecipeLike {
  id: string;
  data: { category: CategoryId; tags: string[]; cookedOn: Date };
}

export interface TagEntry<T extends RecipeLike> {
  name: string;
  slug: string;
  recipes: T[];
}

export function getTagIndex<T extends RecipeLike>(recipes: T[]): Map<string, TagEntry<T>> {
  const index = new Map<string, TagEntry<T>>();
  for (const recipe of recipes) {
    for (const tag of recipe.data.tags) {
      const slug = slugify(tag);
      if (!slug) continue;
      const entry = index.get(slug) ?? { name: tag, slug, recipes: [] };
      if (!entry.recipes.includes(recipe)) entry.recipes.push(recipe);
      index.set(slug, entry);
    }
  }
  return index;
}

export function groupByCategory<T extends RecipeLike>(recipes: T[]): Map<CategoryId, T[]> {
  const groups = new Map<CategoryId, T[]>(CATEGORY_IDS.map((id) => [id, []]));
  for (const recipe of recipes) groups.get(recipe.data.category)!.push(recipe);
  return groups;
}
