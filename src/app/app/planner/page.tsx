import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DayMeals from "./DayMeals";

type MealPlanRow = {
  id: string;
  plan_date: string; // "YYYY-MM-DD"
  recipe: {
    id: string;
    title: string;
  } | null;
};

type RecipeRow = {
  id: string;
  title: string;
};


// Helper: get Monday–Sunday for the current week
function getCurrentWeek() {
  const today = new Date();
  const jsDay = today.getDay(); // 0 = Sun, 1 = Mon, ...
  const diffToMonday = (jsDay + 6) % 7; // 0 if Monday, 1 if Tuesday, ...

  const monday = new Date(today);
  monday.setDate(today.getDate() - diffToMonday);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      label: d.toLocaleDateString("en-US", { weekday: "long" }),
      shortLabel: d.toLocaleDateString("en-US", { weekday: "short" }),
      isoDate: d.toISOString().slice(0, 10), // YYYY-MM-DD
    };
  });

  return {
    days,
    weekStartISO: days[0].isoDate,
    weekEndISO: days[6].isoDate,
  };
}

export default async function MealPlannerPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Just in case layout didn't already protect this
    redirect("/login?redirect=/app/planner");
  }

  const { days, weekStartISO, weekEndISO } = getCurrentWeek();

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

    const { data: recipesData } = await supabase
    .from("recipe")
    .select("id, title")
    .eq("user_id", user.id)
    .order("title", { ascending: true });

  const recipes = (recipesData ?? []) as RecipeRow[];


  if (error) {
    console.error("Error loading meal plan:", error);
  }

  const byDate = new Map<string, MealPlanRow[]>();

  // Tell TypeScript what shape the rows have
  const rows = (entries ?? []) as unknown as MealPlanRow[];

  for (const entry of rows) {
    const key = entry.plan_date;
    if (!byDate.has(key)) {
      byDate.set(key, []);
    }
    byDate.get(key)!.push(entry);
  }


  return (
    <div className="space-y-8 py-8">
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

      {/* Week range summary */}
      <p className="text-xs text-muted-foreground">
        Week of{" "}
        <span className="font-medium">
          {days[0].label} ({days[0].isoDate})
        </span>{" "}
        –{" "}
        <span className="font-medium">
          {days[6].label} ({days[6].isoDate})
        </span>
      </p>

      {/* Week grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {days.map((day) => {
          const meals = byDate.get(day.isoDate) ?? [];

          return (
            <Card key={day.isoDate} className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-baseline justify-between text-base font-semibold">
                  <span>{day.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {day.isoDate}
                  </span>
                </CardTitle>
              </CardHeader>

                <CardContent className="flex flex-1 flex-col justify-between gap-3 text-sm">
                <DayMeals
                    isoDate={day.isoDate}
                    dayLabel={day.label}
                    meals={meals}
                    recipes={recipes}
                />
                </CardContent>

            </Card>
          );
        })}
      </div>
    </div>
  );
}
