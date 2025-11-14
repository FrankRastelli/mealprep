import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Button } from "@/components/ui/button";
import PlannerBoard, {
  MealPlanRow,
  PlannerDay,
  RecipeRow,
} from "./PlannerBoard";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    week?: string;
  }>;
};

// Helper: given a base date, get Monday–Sunday
function getWeekFor(baseDate: Date) {
  const jsDay = baseDate.getDay(); // 0 = Sun, 1 = Mon, ...
  const diffToMonday = (jsDay + 6) % 7; // 0 if Monday, 1 if Tue, ...

  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - diffToMonday);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      label: d.toLocaleDateString("en-US", { weekday: "long" }),
      isoDate: d.toISOString().slice(0, 10), // YYYY-MM-DD
    };
  });

  return {
    days,
    weekStartISO: days[0].isoDate,
    weekEndISO: days[6].isoDate,
  };
}

export default async function MealPlannerPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/app/planner");
  }

  // Read ?week=YYYY-MM-DD from the URL (Next 16: searchParams is a Promise)
  const { week } = await searchParams;

  let baseDate = new Date();
  if (week) {
    const parsed = new Date(week);
    if (!Number.isNaN(parsed.getTime())) {
      baseDate = parsed;
    }
  }

  const { days, weekStartISO, weekEndISO } = getWeekFor(baseDate);

  // Compute prev/next week Monday dates for links
  const currentMonday = new Date(days[0].isoDate);
  const prevMonday = new Date(currentMonday);
  prevMonday.setDate(currentMonday.getDate() - 7);
  const nextMonday = new Date(currentMonday);
  nextMonday.setDate(currentMonday.getDate() + 7);

  const prevWeekParam = prevMonday.toISOString().slice(0, 10);
  const nextWeekParam = nextMonday.toISOString().slice(0, 10);

  // Load entries for this week
  const { data: entries, error } = await supabase
    .from("meal_plan_entry")
    .select(
      `
      id,
      plan_date,
      recipe:recipe_id (
        id,
        title
      )
    `
    )
    .eq("user_id", user!.id)
    .gte("plan_date", weekStartISO)
    .lte("plan_date", weekEndISO)
    .order("plan_date", { ascending: true });

  if (error) {
    console.error("Error loading meal plan:", error);
  }

  const rows = (entries ?? []) as unknown as MealPlanRow[];

  // Group by date
  const byDate = new Map<string, MealPlanRow[]>();
  for (const entry of rows) {
    const key = entry.plan_date;
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(entry);
  }

  // Load all recipes for this user
  const { data: recipesData } = await supabase
    .from("recipe")
    .select("id, title")
    .eq("user_id", user.id)
    .order("title", { ascending: true });

  const recipes = (recipesData ?? []) as RecipeRow[];

  const plannerDays: PlannerDay[] = days.map((d) => ({
    isoDate: d.isoDate,
    label: d.label,
    meals: byDate.get(d.isoDate) ?? [],
  }));

  return (
    <div className="space-y-4">
      {/* Top header */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meal Planner</h1>
          <p className="text-sm text-muted-foreground">
            Plan your week using your saved recipes.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/app/recipes">
            <Button variant="outline" size="sm">
              Manage recipes
            </Button>
          </Link>
        </div>
      </header>

      {/* Week navigation + summary */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Link href={`/app/planner?week=${prevWeekParam}`}>
            <Button size="sm" variant="outline">
              ← Previous week
            </Button>
          </Link>
          <Link href={`/app/planner?week=${nextWeekParam}`}>
            <Button size="sm" variant="outline">
              Next week →
            </Button>
          </Link>
        </div>

        <Link href={`/app/planner/grocery-list?week=${weekStartISO}`}>
        <Button variant="default" size="sm">
            Generate Grocery List
        </Button>
        </Link>


        <p>
          Week of{" "}
          <span className="font-medium">
            {days[0].label} ({days[0].isoDate})
          </span>{" "}
          –{" "}
          <span className="font-medium">
            {days[6].label} ({days[6].isoDate})
          </span>
        </p>
      </div>

      {/* DnD planner grid */}
      <PlannerBoard days={plannerDays} recipes={recipes} />
    </div>
  );
}
