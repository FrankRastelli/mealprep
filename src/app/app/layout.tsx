import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login?redirect=/app");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
  <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
    <Link href="/app" className="text-xl font-bold text-slate-900">
      MealPrep
    </Link>

    <nav className="flex items-center gap-6 text-sm text-slate-700">
      <Link href="/app" className="hover:text-black">
        Dashboard
      </Link>

      <Link href="/app/recipes" className="hover:text-black">
        Recipes
      </Link>

      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="text-red-600 hover:text-red-800 font-medium"
        >
          Log out
        </button>
      </form>
    </nav>
  </div>
</header>


      <main className="max-w-4xl mx-auto p-6">{children}</main>
    </div>
  );
}
