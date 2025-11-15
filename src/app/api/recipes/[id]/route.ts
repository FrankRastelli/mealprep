// src/app/api/recipes/[id]/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET(_req: Request, context: any) {
  try {
    const { id } = await context.params; // handles Promise or plain object
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("recipe")
      .select(
        "id, user_id, title, ingredients, instructions, image_url, created_at"
      )
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
  } catch (err) {
    console.error("Unhandled error in GET /api/recipes/[id]", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, context: any) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const body = await req.json();

    const { title, ingredients, instructions } = body;

    const { data, error } = await supabase
      .from("recipe")
      .update({
        title,
        ingredients,
        instructions,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating recipe", error);
      return NextResponse.json(
        { error: "Failed to update recipe" },
        { status: 500 }
      );
    }

    return NextResponse.json({ recipe: data });
  } catch (err) {
    console.error("Unhandled error in PUT /api/recipes/[id]", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, context: any) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();

    const { error } = await supabase.from("recipe").delete().eq("id", id);

    if (error) {
      console.error("Error deleting recipe", error);
      return NextResponse.json(
        { error: "Failed to delete recipe" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unhandled error in DELETE /api/recipes/[id]", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
