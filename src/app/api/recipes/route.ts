import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server"; // or "@/lib/supabase-server"
import { parseIngredientLine } from "@/lib/parse-ingredient";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ recipes: [] });
  }

  const { data, error } = await supabase
    .from("recipe")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching recipes", error);
    return NextResponse.json(
      { error: "Failed to load recipes", recipes: [] },
      { status: 500 }
    );
  }

  return NextResponse.json({ recipes: data ?? [] });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = await req.json();
  const { title, ingredients, instructions } = body as {
    title: string;
    ingredients: string;
    instructions: string;
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  // 1) Create the recipe row itself
  const { data: recipe, error: insertError } = await supabase
    .from("recipe")
    .insert({
      user_id: user.id,
      title,
      ingredients,
      instructions,
    })
    .select("*")
    .single();

  if (insertError || !recipe) {
    console.error("Error inserting recipe", insertError);
    return NextResponse.json(
      { error: "Failed to create recipe" },
      { status: 500 }
    );
  }

  // 2) Build structured ingredients
  const lines =
    ingredients
      ?.split("\n")
      .map((l: string) => l.trim())
      .filter(Boolean) ?? [];

  const ingredientRows = lines
    .map((line) => {
      const parsed = parseIngredientLine(line);
      if (!parsed) return null;
      return {
        recipe_id: recipe.id,
        user_id: user.id,
        line,
        label: parsed.label,
        quantity: parsed.quantity,
        unit: parsed.unit,
        food_id: null, // later we'll fill this when we hook up FoodSearch IDs
      };
    })
    .filter(Boolean) as {
    recipe_id: string;
    user_id: string;
    line: string;
    label: string;
    quantity: number;
    unit?: string | null;
    food_id: string | null;
  }[];

  if (ingredientRows.length > 0) {
    const { error: ingredientsError } = await supabase
      .from("recipe_ingredient")
      .insert(ingredientRows);

    if (ingredientsError) {
      console.error("Error inserting recipe ingredients", ingredientsError);
      // We don't fail the whole request here; the main recipe was created.
    }
  }

  return NextResponse.json({ recipe });
}
