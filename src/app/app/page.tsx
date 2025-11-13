import { createClient } from "@/lib/supabase-server";
import Link from "next/link";

export default async function AppHome() {
  const supabase = await createClient();                         // await here
  const { data } = await supabase.auth.getUser();

  return (
    <main className="p-6 space-y-3">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-sm text-gray-600">Signed in as {data.user?.email}</p>

      <p>
        <Link href="/app/recipes" className="underline text-blue-600">
          Go to Recipes
        </Link>
      </p>

      <form action="/auth/signout" method="post">
        <button className="rounded bg-gray-200 px-3 py-1" type="submit">Sign out</button>
      </form>
    </main>
  );
}
