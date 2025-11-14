import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  const plan_date = body?.plan_date as string | undefined; // "YYYY-MM-DD"
  const recipe_id = body?.recipe_id as string | undefined;

  if (!plan_date || !recipe_id) {
    return NextResponse.json(
      { error: "Missing plan_date or recipe_id" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("meal_plan_entry").insert({
    user_id: user.id,
    plan_date,
    recipe_id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
