'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setErr(error.message);
    else {
      setOk(true);
      // optional: auto sign-in after confirm; for now, send to login
      setTimeout(() => router.push('/login'), 800);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <form onSubmit={onSubmit} className="max-w-sm w-full space-y-3">
        <h1 className="text-2xl font-semibold">Create account</h1>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="you@example.com"
          type="email" value={email} onChange={e=>setEmail(e.target.value)}
          required
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Password (min 6 chars)"
          type="password" value={password} onChange={e=>setPassword(e.target.value)}
          required minLength={6}
        />
        <button className="w-full rounded bg-black text-white py-2">Sign up</button>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        {ok && <p className="text-green-600 text-sm">Check your email to confirm, then log in.</p>}
        <p className="text-sm">
          Already have an account? <a className="underline" href="/login">Log in</a>
        </p>
      </form>
    </main>
  );
}
