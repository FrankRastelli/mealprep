"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
      const { error } = await res.json().catch(() => ({ error: "Failed" }));
      setError(error || "Failed to save");
      return;
    }

    // Clear form and refresh list
    setTitle(""); setIngredients(""); setInstructions("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border rounded p-4">
      <h2 className="text-lg font-medium">Add a Recipe</h2>

      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Title (e.g., Chicken Alfredo)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />

      <textarea
        className="w-full border rounded px-3 py-2"
        placeholder="Ingredients (one per line)"
        rows={4}
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
        required
      />

      <textarea
        className="w-full border rounded px-3 py-2"
        placeholder="Instructions"
        rows={5}
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        required
      />

      <button
        disabled={saving}
        className="rounded bg-black text-white px-4 py-2 disabled:opacity-60"
        type="submit"
      >
        {saving ? "Saving..." : "Save Recipe"}
      </button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
