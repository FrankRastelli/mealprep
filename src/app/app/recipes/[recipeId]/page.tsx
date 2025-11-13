import Link from "next/link";
import { createClient } from "@/lib/supabase-server";

export default async function RecipeDetail({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;       // ⬅️ unwrap

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recipe")
    .select("id, title, ingredients, instructions, created_at")
    .eq("id", recipeId)
    .single();

  if (error || !data) {
    return (
      <main className="p-6">
        <p className="text-red-600">Couldn’t load that recipe.</p>
        <p className="text-xs text-gray-500">{error?.message}</p>
        <Link href="/app/recipes" className="underline">← Back</Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <Link href="/app/recipes" className="underline">← Back to Recipes</Link>
      <h1 className="text-2xl font-semibold">{data.title}</h1>
      <div className="text-xs text-gray-500">
        {new Date(data.created_at!).toLocaleString()}
      </div>
      <section>
        <h2 className="font-medium mb-1">Ingredients</h2>
        <pre className="whitespace-pre-wrap border rounded p-3">{data.ingredients}</pre>
      </section>
      <section>
        <h2 className="font-medium mb-1">Instructions</h2>
        <pre className="whitespace-pre-wrap border rounded p-3">{data.instructions}</pre>
      </section>
    </main>
  );
}
