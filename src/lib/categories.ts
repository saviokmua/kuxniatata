export const CATEGORIES = {
  supy: 'Супи',
  osnovni: 'Основні страви',
  vypichka: 'Випічка',
  deserty: 'Десерти',
  zakusky: 'Закуски',
  napoi: 'Напої',
} as const;

export type CategoryId = keyof typeof CATEGORIES;

export const CATEGORY_IDS = Object.keys(CATEGORIES) as [CategoryId, ...CategoryId[]];
