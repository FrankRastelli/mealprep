// src/app/page.tsx
import { supabase } from "@/lib/supabase";

export default async function Home() {
  // simple Supabase test: count recipes
  const { data, error } = await supabase.from("recipe").select("id", { count: "exact", head: true });

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-xl p-6">
        <h1 className="text-3xl font-bold mb-2">MealPrep MVP</h1>
        <p className="text-muted-foreground mb-6">
          If you can read this, Next.js is working. Supabase status:
          {" "}
          {error ? (
            <span className="text-red-600">error – check env keys</span>
          ) : (
            <span className="text-green-600">ok</span>
          )}
        </p>
        <p>Recipes in database: <strong>{data?.length ?? 0}</strong></p>
      </div>
    </main>
  );
}
