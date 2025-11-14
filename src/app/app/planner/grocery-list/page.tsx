import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase-server";

type AggregatedItem = {
  key: string;
  label: string;
  quantity: number;
};

// Parse a free-text ingredient line like "2 eggs" or "1 cup milk"
function parseIngredientLine(line: string): {
  key: string;
  label: string;
  quantity: number;
} {
  const trimmed = line.trim();
  if (!trimmed) {
    return { key: "", label: "", quantity: 0 };
  }

  // Look for a leading integer quantity
  const match = trimmed.match(/^(\d+)\s+(.+)$/);
  if (!match) {
    // No leading number → assume quantity 1, label is whole line
    const label = trimmed;
    const key = label.toLowerCase();
    return { key, label, quantity: 1 };
  }

  const qty = Number(match[1]) || 1;
  let label = match[2].trim(); // e.g. "eggs", "cup milk"

  // Tiny singularization so "egg" and "eggs" group together
  if (label.endsWith("s") && !label.endsWith("ss")) {
    label = label.slice(0, -1);
  }

  const key = label.toLowerCase();
  return { key, label, quantity: qty };
}

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

  // Load meal plan entries (with recipe + ingredients)
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

// Gather all raw ingredient lines for this week
const ingredientLines: string[] = meals.flatMap((entry: any) => {
  // ingredients is stored as a single text field with one ingredient per line
  const raw = (entry.recipe?.ingredients ?? "") as string;
  if (!raw) return [];

  return raw
    .split(/\r?\n/)           // split by newline
    .map((line) => line.trim())
    .filter(Boolean);         // drop empty lines
});


  // Aggregate by category → items. For now, everything is "Other".
  const aggregatedByCategory: Record<string, AggregatedItem[]> = {};

  for (const line of ingredientLines) {
    const category = "Other"; // we'll add real categories later
    const parsed = parseIngredientLine(line);

    if (!parsed.label || parsed.quantity <= 0) continue;

    if (!aggregatedByCategory[category]) {
      aggregatedByCategory[category] = [];
    }

    const list = aggregatedByCategory[category];

    const existing = list.find((item) => item.key === parsed.key);
    if (existing) {
      existing.quantity += parsed.quantity;
    } else {
      list.push({
        key: parsed.key,
        label: parsed.label,
        quantity: parsed.quantity,
      });
    }
  }

  const categories = Object.keys(aggregatedByCategory).sort();

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
            <ul className="space-y-1 rounded-md border bg-muted/30 p-4 text-sm">
              {aggregatedByCategory[category]?.map((item) => (
                <li key={item.key}>
                  {item.quantity} {item.label}
                </li>
              ))}
            </ul>
          </section>
        ))}

        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No meals planned for this week.
          </p>
        )}
      </div>
    </div>
  );
}
