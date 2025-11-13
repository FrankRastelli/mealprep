"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function NewRecipeForm() {
  const [title, setTitle] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, ingredients, instructions }),
    });

    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Failed to save recipe");
      return;
    }

    // clear form + refresh list
    setTitle("");
    setIngredients("");
    setInstructions("");
    router.refresh();
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Add a Recipe</CardTitle>
        <CardDescription>
          Save your go-to meals with ingredients and instructions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <Input
              placeholder="e.g. Chicken Alfredo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Ingredients</label>
            <Textarea
              placeholder={"One per line:\n- 2 eggs\n- 1 cup milk\n- ..."}
              rows={4}
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              required
            />
            <p className="text-xs text-slate-500">
              You can put one ingredient per line for now.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Instructions</label>
            <Textarea
              placeholder="Step-by-step instructions..."
              rows={5}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Recipe"}
            </Button>
            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
