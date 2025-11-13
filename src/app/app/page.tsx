import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // App layout will redirect, but this is a safety net
    return null;
  }

  // Get recipe count for this user
  const { count } = await supabase
    .from("recipe")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-slate-500">
          Signed in as <span className="font-medium">{user.email}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your recipes</CardTitle>
            <CardDescription>
              Store your go-to meals so you can reuse them for meal plans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {typeof count === "number" ? count : 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {count === 1 ? "recipe saved" : "recipes saved so far"}
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/app/recipes">
              <Button size="sm">View recipes</Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What&apos;s next</CardTitle>
            <CardDescription>
              This will eventually show meal plans, macros, and more.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p>• Create a few recipes you cook all the time.</p>
            <p>• Soon: build weekly meal plans from your saved recipes.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
