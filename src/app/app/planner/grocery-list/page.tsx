// src/app/app/planner/grocery-list/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Row returned from Supabase
type MealPlanRow = {
  id: string;
  plan_date: string; 
  recipe: {
    id: string;
    title: string;
    ingredients: string | null;
  } | null;
};

// Aggregated grocery item
type GroceryItem = {
  key: string;
  label: string;
  quantity: number;
};

type GroceryListPageProps = {
  searchParams: { week?: string };
};

// ---------------------------------------------------
// WEEK HELPERS
// ---------------------------------------------------
function getWeekRangeFromParam(weekParam?: string) {
  const today = new Date();
  const base = weekParam ? new Date(weekParam) : today;

  const day = base.getDay(); 
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(base);
  monday.setDate(base.getDate() + diff);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const toISO = (d: Date) => d.toISOString().slice(0, 10);

  return {
    weekStartISO: toISO(monday),
    weekEndISO: toISO(sunday),
    weekStart: monday,
    weekEnd: sunday,
  };
}

// ---------------------------------------------------
// INGREDIENT PARSING + FORMATTING
// ---------------------------------------------------
function parseIngredientLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed) return { key: "", label: "", quantity: 0 };

  // Matches "2 eggs", "1 cup milk", "1.5 tbsp butter"
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s+(.*)$/);
  if (match) {
    const quantity = Number(match[1]);
    const label = match[2].trim();
    return {
      key: label.toLowerCase(),
      label,
      quantity: isNaN(quantity) ? 1 : quantity,
    };
  }

  // Otherwise treat whole line as label
  return {
    key: trimmed.toLowerCase(),
    label: trimmed,
    quantity: 1,
  };
}

// Pluralization logic for units + ingredients
function pluralizeWord(word: string) {
  const lower = word.toLowerCase();

  const noPlural = ["tbsp", "tsp", "oz", "ml", "g", "kg", "lb"];
  if (noPlural.includes(lower)) return word;

  if (lower.endsWith("s")) return word;

  return word + "s";
}

function formatIngredient(label: string, quantity: number) {
  const parts = label.trim().split(/\s+/);

  // Single-word ingredient ("egg")
  if (parts.length === 1) {
    const ingredient = quantity === 1 ? label : pluralizeWord(label);
    return `${quantity} ${ingredient}`;
  }

  // Multi-word ingredient ("cup milk")
  const [unit, ...rest] = parts;
  const unitDisplay = quantity === 1 ? unit : pluralizeWord(unit);
  return `${quantity} ${unitDisplay} ${rest.join(" ")}`;
}

// ---------------------------------------------------
// PAGE
// ---------------------------------------------------
export default async function GroceryListPage({ searchParams }: GroceryListPageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/app/planner");

  const { weekStartISO, weekEndISO, weekStart, weekEnd } =
    getWeekRangeFromParam(searchParams.week);

  // Fetch all meals this week
  const { data, error } = await supabase
    .from("meal_plan_entry")
    .select(
      `
      id,
      plan_date,
      recipe:recipe_id (
        id,
        title,
        ingredients
      )
    `
    )
    .eq("user_id", user.id)
    .gte("plan_date", weekStartISO)
    .lte("plan_date", weekEndISO)
    .order("plan_date", { ascending: true });

  if (error) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6">
        <p className="text-red-600">Could not load grocery list.</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button asChild variant="outline">
          <Link href="/app/planner">Back to planner</Link>
        </Button>
      </div>
    );
  }

  const rows = (data ?? []) as any[];

  const meals: MealPlanRow[] = rows.map((row) => ({
    id: row.id,
    plan_date: row.plan_date,
    recipe: row.recipe
      ? {
          id: row.recipe.id,
          title: row.recipe.title,
          ingredients: row.recipe.ingredients,
        }
      : null,
  }));

  // No meals → friendly message
  if (meals.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Grocery List</h1>
            <p className="text-muted-foreground">
              Week of {weekStartISO} – {weekEndISO}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/app/planner?week=${weekStartISO}`}>Back to planner</Link>
          </Button>
        </header>
        <Card>
          <CardContent className="p-6">
            You haven’t added meals to this week yet.
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------------------------------------------------
  // AGGREGATE INGREDIENTS
  // ---------------------------------------------------
  const aggregated: Record<string, GroceryItem> = {};

  for (const meal of meals) {
    const ingredientsText = meal.recipe?.ingredients ?? "";
    const lines = ingredientsText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      const parsed = parseIngredientLine(line);
      if (!parsed.label || parsed.quantity <= 0) continue;

      const existing = aggregated[parsed.key];
      if (existing) {
        existing.quantity += parsed.quantity;
      } else {
        aggregated[parsed.key] = {
          key: parsed.key,
          label: parsed.label,
          quantity: parsed.quantity,
        };
      }
    }
  }

  const items = Object.values(aggregated).sort((a, b) =>
    a.label.localeCompare(b.label)
  );

  // ---------------------------------------------------
  // RENDER
  // ---------------------------------------------------
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grocery List</h1>
          <p className="text-sm text-muted-foreground">
            Week of {weekStartISO} – {weekEndISO}
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href={`/app/planner?week=${weekStartISO}`}>Back to planner</Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Other</CardTitle>
        </CardHeader>

        <CardContent>
          <ul className="space-y-1 text-sm">
            {items.map((item) => (
              <li key={item.key} className="flex gap-2">
                <span className="font-medium">
                  {formatIngredient(item.label, item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
