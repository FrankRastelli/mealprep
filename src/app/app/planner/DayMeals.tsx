"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";

type MealPlanRow = {
  id: string;
  plan_date: string;
  recipe: {
    id: string;
    title: string;
  } | null;
};

type RecipeRow = {
  id: string;
  title: string;
};

type DayMealsProps = {
  isoDate: string;          // "YYYY-MM-DD"
  dayLabel: string;         // "Monday", etc.
  meals: MealPlanRow[];
  recipes: RecipeRow[];
};

export default function DayMeals({
  isoDate,
  dayLabel,
  meals,
  recipes,
}: DayMealsProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [recipeId, setRecipeId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // This day is a droppable area
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: isoDate, // droppable id = the date
  });

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!recipeId) return;

    setSaving(true);
    setError(null);

    const res = await fetch("/api/meal-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan_date: isoDate,
        recipe_id: recipeId,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Failed to add meal");
      return;
    }

    setShowForm(false);
    setRecipeId("");
    router.refresh(); // reloads server data
  }

  async function handleDelete(mealId: string) {
    const sure = window.confirm("Remove this meal from the plan?");
    if (!sure) return;

    setDeletingId(mealId);
    setError(null);

    const res = await fetch(`/api/meal-plan/${mealId}`, {
      method: "DELETE",
    });

    setDeletingId(null);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Failed to delete meal");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-3">
      {/* Drop zone area */}
      <div
        ref={setDropRef}
        className={`space-y-2 rounded-md p-1 text-sm ${
          isOver ? "bg-muted/60" : ""
        }`}
      >
        {meals.length === 0 ? (
          <p className="text-muted-foreground">No meals planned yet.</p>
        ) : (
          <ul className="space-y-2">
            {meals.map((meal) => (
              <DraggableMeal
                key={meal.id}
                meal={meal}
                onDelete={() => handleDelete(meal.id)}
                deleting={deletingId === meal.id}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Error, if any */}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {/* Add form or button */}
      {!showForm ? (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setShowForm(true)}
          disabled={recipes.length === 0}
        >
          {recipes.length === 0 ? "Add recipes first" : "+ Add meal"}
        </Button>
      ) : (
        <form onSubmit={handleSave} className="space-y-2 border rounded-md p-3">
          <div className="space-y-1 text-sm">
            <label className="font-medium">Recipe</label>
            <select
              className="w-full rounded-md border bg-background px-2 py-1 text-sm"
              value={recipeId}
              onChange={(e) => setRecipeId(e.target.value)}
            >
              <option value="">Select a recipe</option>
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              size="sm"
              className="flex-1"
              disabled={saving || !recipeId}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowForm(false);
                setRecipeId("");
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function DraggableMeal({
  meal,
  onDelete,
  deleting,
}: {
  meal: MealPlanRow;
  onDelete: () => void;
  deleting: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: meal.id,
    data: { date: meal.plan_date }, // tells DndContext which day it came from
  });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    opacity: isDragging ? 0.6 : 1,
    cursor: "grab",
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-start justify-between gap-2 rounded-md border bg-muted/40 px-3 py-2"
    >
      <div>
        {meal.recipe ? (
          <Link
            href={`/app/recipes/${meal.recipe.id}`}
            className="font-medium underline-offset-2 hover:underline"
          >
            {meal.recipe.title}
          </Link>
        ) : (
          <span className="font-medium text-muted-foreground">
            (Missing recipe)
          </span>
        )}
      </div>
        <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-xs text-red-600 hover:text-red-700"
        disabled={deleting}
        // prevent drag from hijacking this interaction
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
            e.stopPropagation();
            onDelete();
        }}
        >
        {deleting ? "Removing..." : "Remove"}
        </Button>
    </li>
  );
}
