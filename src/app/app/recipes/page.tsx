import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import NewRecipeForm from "./recipe-form";

export const dynamic = "force-dynamic"; // always fetch fresh list

export default async function RecipesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  // Guard (layout should already protect /app, but double-check)
  if (!user) return null;

  const { data: recipes } = await supabase
    .from("recipe")
    .select("id,title,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your Recipes</h1>
        <Link href="/app">Back to Dashboard</Link>
      </div>

      <NewRecipeForm />

      <div className="space-y-2">
        {!recipes?.length && <p className="text-sm text-gray-500">No recipes yet.</p>}
        {recipes?.map((r) => (
        <div key={r.id} className="border rounded p-3">
            <div className="font-medium">
            <Link href={`/app/recipes/${r.id}`} className="underline">
                {r.title}
            </Link>
            </div>
            <div className="text-xs text-gray-500">
            {new Date(r.created_at!).toLocaleString()}
            </div>
        </div>
        ))}
      </div>
    </main>
  );
}
