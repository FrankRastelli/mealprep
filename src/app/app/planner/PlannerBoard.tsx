"use client";

import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import DayMeals from "./DayMeals";

export type MealPlanRow = {
  id: string;
  plan_date: string; // "YYYY-MM-DD"
  recipe: {
    id: string;
    title: string;
  } | null;
};

export type RecipeRow = {
  id: string;
  title: string;
};

export type PlannerDay = {
  isoDate: string;
  label: string;
  meals: MealPlanRow[];
};

type PlannerBoardProps = {
  days: PlannerDay[];
  recipes: RecipeRow[];
};

export default function PlannerBoard({ days, recipes }: PlannerBoardProps) {
  const router = useRouter();

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const mealId = active.id as string;
    const fromDate = active.data.current?.date as string | undefined;
    const toDate = over.id as string;

    if (!fromDate || fromDate === toDate) {
      return;
    }

    // Call PATCH to update the plan_date
    const res = await fetch(`/api/meal-plan/${mealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan_date: toDate }),
    });

    if (!res.ok) {
      console.error(await res.text());
      return;
    }

    router.refresh();
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-8 py-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {days.map((day) => (
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
                  meals={day.meals}
                  recipes={recipes}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DndContext>
  );
}
