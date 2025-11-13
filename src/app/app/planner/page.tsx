import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function MealPlannerPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 py-8">
      {/* Top header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meal Planner</h1>
          <p className="text-sm text-muted-foreground">
            Plan your week using your saved recipes.
          </p>
        </div>

        <Link href="/app/recipes">
          <Button variant="outline" size="sm">
            Manage recipes
          </Button>
        </Link>
      </header>

      {/* Week grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {WEEK_DAYS.map((day) => (
          <Card key={day} className="flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">{day}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-2 text-sm">
              {/* Placeholder for now – we’ll replace with real data later */}
              <p className="text-muted-foreground">
                No meals planned yet.
              </p>

              <Button className="mt-2 w-full" size="sm" variant="outline">
                + Add meal
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
