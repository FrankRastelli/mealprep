import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import NewRecipeForm from "./recipe-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function RecipesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: recipes } = await supabase
    .from("recipe")
    .select("id,title,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Your Recipes</h1>
          <p className="text-sm text-slate-500">
            Save meals you cook often so you can quickly build meal plans later.
          </p>
        </div>
        <Link
          href="/app"
          className="text-sm text-slate-600 underline underline-offset-4"
        >
          Back to dashboard
        </Link>
      </div>

      <NewRecipeForm />

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-slate-700">Saved recipes</h2>
        {!recipes?.length && (
          <p className="text-sm text-slate-500">
            No recipes yet — add your first one above.
          </p>
        )}

        <div className="space-y-2">
          {recipes?.map((r) => (
            <Card key={r.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <CardTitle className="text-base">
                    <Link
                      href={`/app/recipes/${r.id}`}
                      className="underline underline-offset-4"
                    >
                      {r.title}
                    </Link>
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    {new Date(r.created_at!).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Recipe
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">
                  Click the title to view full ingredients and instructions.
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
