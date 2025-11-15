import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

type RouteContext = {
  params: { id: string };
};

// GET /api/recipes/[id]  -> fetch a single recipe
export async function GET(_req: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { id } = params;

  const { data, error } = await supabase
    .from("recipe")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching recipe", error);
    return NextResponse.json(
      { error: "Failed to load recipe" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Recipe not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ recipe: data });
}

// PUT /api/recipes/[id]  -> update a recipe
export async function PUT(req: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { id } = params;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { title, ingredients, instructions } = body as {
    title: string;
    ingredients: string;
    instructions: string;
  };

  const { data, error } = await supabase
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

  if (error) {
    console.error("Error updating recipe", error);
    return NextResponse.json(
      { error: "Failed to update recipe" },
      { status: 500 }
    );
  }

  return NextResponse.json({ recipe: data });
}

// DELETE /api/recipes/[id]  -> delete a recipe
export async function DELETE(_req: Request, { params }: RouteContext) {
  const supabase = await createClient();
  const { id } = params;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

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
