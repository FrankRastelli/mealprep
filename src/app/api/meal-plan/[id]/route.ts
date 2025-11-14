import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: RouteParams) {
  const { id } = await params; // Next 16: params is a Promise

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const plan_date = body?.plan_date as string | undefined;

  if (!plan_date) {
    return NextResponse.json(
      { error: "Missing plan_date" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("meal_plan_entry")
    .update({ plan_date })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const { error } = await supabase
    .from("meal_plan_entry")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
