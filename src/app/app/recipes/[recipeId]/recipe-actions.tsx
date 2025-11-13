"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type RecipeActionsProps = {
  recipeId: string;
  initialTitle: string;
  initialIngredients: string;
  initialInstructions: string;
};

export function RecipeActions({
  recipeId,
  initialTitle,
  initialIngredients,
  initialInstructions,
}: RecipeActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [instructions, setInstructions] = useState(initialInstructions);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch(`/api/recipes/${recipeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, ingredients, instructions }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Failed to update recipe");
      return;
    }

    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    const sure = window.confirm("Delete this recipe? This cannot be undone.");
    if (!sure) return;

    setDeleting(true);
    setError(null);

    const res = await fetch(`/api/recipes/${recipeId}`, {
      method: "DELETE",
    });

    setDeleting(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Failed to delete recipe");
      return;
    }

    router.push("/app/recipes");
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={() => setEditing(true)}>
          Edit recipe
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? "Deleting..." : "Delete"}
        </Button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  // Editing mode
  return (
    <form onSubmit={handleSave} className="space-y-3 border rounded-md p-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Ingredients</label>
        <Textarea
          rows={4}
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Instructions</label>
        <Textarea
          rows={5}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          type="button"
          onClick={() => {
            setEditing(false);
            setTitle(initialTitle);
            setIngredients(initialIngredients);
            setInstructions(initialInstructions);
            setError(null);
          }}
        >
          Cancel
        </Button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </form>
  );
}
