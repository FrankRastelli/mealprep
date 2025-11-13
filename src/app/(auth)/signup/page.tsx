"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) setErrorMsg(error.message);
    else router.push("/app");
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="max-w-sm w-full space-y-3">
        <h1 className="text-2xl font-semibold">Create your account</h1>

        <input
          type="email"
          placeholder="you@example.com"
          className="w-full border rounded px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="w-full rounded bg-black text-white py-2">Sign up</button>
        {errorMsg && <p className="text-red-600 text-sm">{errorMsg}</p>}

        <p className="text-sm">
          Already have an account? <a className="underline" href="/login">Log in</a>
        </p>
      </form>
    </main>
  );
}
