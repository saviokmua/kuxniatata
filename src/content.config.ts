import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORY_IDS } from './lib/categories';

const recipes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/recipes' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      image: image(),
      category: z.enum(CATEGORY_IDS),
      tags: z.array(z.string()).default([]),
      time: z.number().int().positive(),
      servings: z.number().int().positive(),
      ingredients: z.array(z.string()).min(1),
      cookedOn: z.coerce.date(),
      notes: z.string().optional(),
    }),
});

export const collections = { recipes };
