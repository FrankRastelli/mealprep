import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server"; // or "@/lib/supabase-server"
import { parseIngredientLine } from "@/lib/parse-ingredient";

type RouteParams = {
  params: { id: string };
};

export async function GET(_req: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = params;

  const { data, error } = await supabase
    .from("recipe")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Recipe not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ recipe: data });
}

export async function PUT(req: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = params;

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

  // 1) Update recipe
  const { data: updated, error: updateError } = await supabase
    .from("recipe")
    .update({
      title,
      ingredients,
      instructions,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (updateError || !updated) {
    console.error("Error updating recipe", updateError);
    return NextResponse.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }

  // 2) Replace structured ingredients for this recipe
  // Delete old ones
  const { error: deleteError } = await supabase
    .from("recipe_ingredient")
    .delete()
    .eq("recipe_id", id)
    .eq("user_id", user.id);

  if (deleteError) {
    console.error("Error deleting old recipe ingredients", deleteError);
    // keep going, we'll just reinsert anyway
  }

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
        recipe_id: id,
        user_id: user.id,
        line,
        label: parsed.label,
        quantity: parsed.quantity,
        unit: parsed.unit,
        food_id: null,
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
      console.error(
        "Error inserting updated recipe ingredients",
        ingredientsError
      );
    }
  }

  return NextResponse.json({ recipe: updated });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  // recipe_ingredient has ON DELETE CASCADE, so deleting recipe is enough
  const { error } = await supabase
    .from("recipe")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error deleting recipe", error);
    return NextResponse.json(
      { error: "Failed to delete recipe" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
