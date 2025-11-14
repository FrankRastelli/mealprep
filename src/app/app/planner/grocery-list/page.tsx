import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase-server";

// Ingredient structure inside each recipe.
// We'll adjust this later if your schema is different.
type RecipeIngredient = {
  ingredient: string;
  quantity: string;
  category: string | null; // e.g. produce, meat, pantry
};

export default async function GroceryListPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/app/planner");
  }

  const { week } = await searchParams;

  if (!week) {
    redirect("/app/planner"); // must have week param
  }

  const baseDate = new Date(week);
  if (Number.isNaN(baseDate.getTime())) {
    redirect("/app/planner");
  }

  // Compute week (Mon–Sun)
  function getWeekFor(date: Date) {
    const jsDay = date.getDay();
    const diffToMonday = (jsDay + 6) % 7;

    const monday = new Date(date);
    monday.setDate(date.getDate() - diffToMonday);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().slice(0, 10);
    });

    return {
      weekStartISO: days[0],
      weekEndISO: days[6],
    };
  }

  const { weekStartISO, weekEndISO } = getWeekFor(baseDate);

  // Load meal plan entries
  const { data: mealEntries } = await supabase
    .from("meal_plan_entry")
    .select(
      `
      id,
      recipe_id,
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
    .lte("plan_date", weekEndISO);

  const meals = mealEntries ?? [];

// Aggregate ingredients (simple version: one ingredient per line)
type AggregatedItem = { ingredient: string; quantity: string; count: number };

const aggregated: Record<string, AggregatedItem[]> = {};

for (const meal of meals) {
  // recipe.ingredients is stored as plain text in DB
  const recipe = meal.recipe as { ingredients?: string | null } | null;

  const raw = (recipe?.ingredients ?? "").trim();
  if (!raw) continue;

  // Each line = one ingredient, e.g.
  //  - 2 eggs
  //  - 1 cup milk
  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const category = "Other"; // we can add real categories later

    if (!aggregated[category]) {
      aggregated[category] = [];
    }

    // If the ingredient already exists, just bump the count
    const existing = aggregated[category].find(
      (item) => item.ingredient.toLowerCase() === line.toLowerCase()
    );

    if (existing) {
      existing.count += 1;
    } else {
      aggregated[category].push({
        ingredient: line,
        quantity: "",
        count: 1,
      });
    }
  }
}



  const categories = Object.keys(aggregated).sort();

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grocery List</h1>
          <p className="text-sm text-muted-foreground">
            Week of {weekStartISO} – {weekEndISO}
          </p>
        </div>

        <Link href={`/app/planner?week=${weekStartISO}`}>
          <Button variant="outline">Back to Planner</Button>
        </Link>
      </header>

      {/* Grocery list content */}
      <div className="space-y-6">
        {categories.map((category) => (
          <section key={category} className="space-y-2">
            <h2 className="text-lg font-semibold">{category}</h2>
            <ul className="space-y-1 rounded-md border p-4 bg-muted/30">
              {aggregated[category].map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{item.ingredient}</span>
                  <span className="text-muted-foreground">{item.quantity}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {categories.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No meals planned for this week.
          </p>
        )}
      </div>
    </div>
  );
}
