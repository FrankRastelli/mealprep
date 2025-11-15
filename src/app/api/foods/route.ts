import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server"; // same helper we used elsewhere

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  if (!q) {
    return NextResponse.json({ foods: [] });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("food")
    .select(
      "id, name, brand, serving_size, serving_unit, calories, protein, carbs, fat"
    )
    .or(
      `name.ilike.%${q}%,brand.ilike.%${q}%`
    )
    .order("name")
    .limit(10);

  if (error) {
    console.error("Food search error:", error);
    return NextResponse.json(
      { error: "Failed to search foods" },
      { status: 500 }
    );
  }

  return NextResponse.json({ foods: data ?? [] });
}
