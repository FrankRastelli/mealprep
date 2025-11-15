// src/lib/parse-ingredient.ts

export type ParsedIngredient = {
  label: string;
  quantity: number;
  unit?: string | null;
};

/**
 * Very simple parser:
 * - Strips bullets / leading numbers
 * - Tries to read a numeric quantity at the start
 *   e.g. "2 eggs" -> { quantity: 2, label: "eggs" }
 *        "1 cup milk" -> { quantity: 1, label: "cup milk" }
 * - Fallback: quantity = 1, label = trimmed line
 */
export function parseIngredientLine(line: string): ParsedIngredient | null {
  if (!line) return null;

  let cleaned = line.trim();

  // Remove leading dash / bullet / number like "1)" or "1."
  cleaned = cleaned.replace(/^[\-\u2022\s]*\d*[\.)]?\s*/, "");

  if (!cleaned) return null;

  const match = cleaned.match(/^(\d+(\.\d+)?)\s+(.+)$/);
  if (match) {
    const quantity = Number(match[1]);
    const label = match[3].trim();
    return {
      label,
      quantity: Number.isFinite(quantity) ? quantity : 1,
      unit: null,
    };
  }

  // No numeric quantity found → assume quantity 1
  return {
    label: cleaned,
    quantity: 1,
    unit: null,
  };
}
