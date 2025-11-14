import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { id } = await params; // unwrap async params (Next 16 behavior)

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
    .eq("user_id", user.id); // extra safety on top of RLS

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
