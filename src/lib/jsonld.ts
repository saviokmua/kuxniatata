export interface JsonLdRecipe {
  data: {
    title: string;
    description: string;
    time: number;
    servings: number;
    ingredients: string[];
    cookedOn: Date;
  };
}

export function recipeJsonLd(recipe: JsonLdRecipe, imageUrl: string): object {
  const { data } = recipe;
  return {
    '@context': 'https://schema.org',
    '@type': 'Recipe',
    name: data.title,
    description: data.description,
    image: imageUrl,
    recipeIngredient: data.ingredients,
    totalTime: `PT${data.time}M`,
    recipeYield: String(data.servings),
    datePublished: data.cookedOn.toISOString().slice(0, 10),
  };
}
