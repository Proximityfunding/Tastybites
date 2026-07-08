import "server-only";

type RecipeRow = { quantity: number; ingredient: { stockQty: number } };

/** How many units of this product can currently be made given ingredient stock. Null = not recipe-tracked (unlimited). */
export function computeAvailableStock(recipe: RecipeRow[]): number | null {
  if (recipe.length === 0) return null;
  let min = Infinity;
  for (const row of recipe) {
    if (row.quantity <= 0) continue;
    const possible = Math.floor(row.ingredient.stockQty / row.quantity);
    if (possible < min) min = possible;
  }
  return min === Infinity ? null : Math.max(0, min);
}
