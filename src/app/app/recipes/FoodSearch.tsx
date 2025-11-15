// src/app/app/recipes/FoodSearch.tsx
"use client";

import { useEffect, useState } from "react";

type Food = {
  id: string;
  name: string;
  brand: string | null;
  serving_size: number | null;
  serving_unit: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

export function FoodSearch({
  onAdd,
}: {
  onAdd: (line: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Fetch suggestions when query changes (simple debounce)
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSelected(null);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/foods?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        setResults(data.foods ?? []);
      } catch (err) {
        if ((err as any).name !== "AbortError") {
          console.error("Food search error", err);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const handleSelect = (food: Food) => {
    setSelected(food);
    setQuantity(1);
  };

  const handleAdd = () => {
    if (!selected) return;

    const q = Math.max(0.25, quantity || 1); // no zero/negative
    const baseCals = selected.calories ?? 0;
    const baseP = selected.protein ?? 0;
    const baseC = selected.carbs ?? 0;
    const baseF = selected.fat ?? 0;

    const totalCals = Math.round(baseCals * q);
    const totalP = +(baseP * q).toFixed(1);
    const totalC = +(baseC * q).toFixed(1);
    const totalF = +(baseF * q).toFixed(1);

    const servingDesc = selected.serving_size
      ? `${q} × ${selected.serving_size} ${selected.serving_unit ?? ""}`.trim()
      : `${q} serving${q === 1 ? "" : "s"}`;

    const brandPart = selected.brand ? ` (${selected.brand})` : "";

    const line = `${servingDesc} ${selected.name}${brandPart} — approx ${totalCals} kcal (P ${totalP}g, C ${totalC}g, F ${totalF}g)`;

    onAdd(line);

    // reset selection but keep query so user can add another similar item
    setSelected(null);
    setQuantity(1);
  };

  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">
        Search food database <span className="text-xs">(optional)</span>
      </h3>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by food or brand (e.g., 'egg', 'oikos yogurt')"
        className="w-full rounded-md border px-3 py-2 text-sm"
      />

      {loading && (
        <p className="text-xs text-muted-foreground">Searching…</p>
      )}

      {!loading && results.length > 0 && (
        <div className="rounded-md border bg-card">
          <ul className="max-h-52 overflow-auto text-sm">
            {results.map((food) => (
              <li key={food.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(food)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-muted"
                >
                  <div>
                    <div className="font-medium">
                      {food.name}
                      {food.brand ? (
                        <span className="text-xs text-muted-foreground">
                          {" "}
                          · {food.brand}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {food.serving_size
                        ? `${food.serving_size} ${food.serving_unit ?? ""}`
                        : "per serving"}
                      {food.calories != null
                        ? ` · ${food.calories} kcal`
                        : null}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected && (
        <div className="rounded-md border bg-card px-3 py-3 text-sm">
          <div className="mb-2 font-medium">
            {selected.name}
            {selected.brand ? (
              <span className="text-xs text-muted-foreground">
                {" "}
                · {selected.brand}
              </span>
            ) : null}
          </div>

          <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              Base serving:{" "}
              {selected.serving_size
                ? `${selected.serving_size} ${selected.serving_unit ?? ""}`
                : "1 serving"}
            </span>
            {selected.calories != null && (
              <span>{selected.calories} kcal</span>
            )}
            {selected.protein != null && (
              <span>P {selected.protein}g</span>
            )}
            {selected.carbs != null && (
              <span>C {selected.carbs}g</span>
            )}
            {selected.fat != null && <span>F {selected.fat}g</span>}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs">
              Qty:
              <input
                type="number"
                min={0.25}
                step={0.25}
                value={quantity}
                onChange={(e) =>
                  setQuantity(parseFloat(e.target.value) || 1)
                }
                className="w-20 rounded-md border px-2 py-1 text-xs"
              />
            </label>
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800"
            >
              Add to ingredients
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
