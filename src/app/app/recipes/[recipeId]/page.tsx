import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

export default async function RecipeDetail({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recipe")
    .select("id, title, ingredients, instructions, created_at")
    .eq("id", recipeId)
    .single();

  if (error || !data) {
    return (
      <div className="space-y-3">
        <Link href="/app/recipes" className="underline text-sm">
          ← Back to recipes
        </Link>
        <p className="text-red-600 text-sm">Couldn&apos;t load that recipe.</p>
        {error?.message && (
          <p className="text-xs text-slate-500">{error.message}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/app/recipes" className="underline text-sm">
        ← Back to recipes
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{data.title}</CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            {new Date(data.created_at!).toLocaleString()}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-800">
              Ingredients
            </h2>
            <pre className="whitespace-pre-wrap text-sm border rounded-md p-3 bg-slate-50">
{data.ingredients}
            </pre>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-800">
              Instructions
            </h2>
            <pre className="whitespace-pre-wrap text-sm border rounded-md p-3 bg-slate-50">
{data.instructions}
            </pre>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
