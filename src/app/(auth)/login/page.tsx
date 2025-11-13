'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string|null>(null);
  const router = useRouter();
  const redirectTo = useSearchParams().get('redirect') || '/app';
  const supabase = createClient();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    else router.push(redirectTo);
  }

  return (
    <main style={{ padding: 24, maxWidth: 360, margin: '0 auto' }}>
      <h1>Log in</h1>
      <form onSubmit={onSubmit}>
        <input placeholder="you@example.com" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button type="submit">Log in</button>
        {err && <p style={{ color: 'red' }}>{err}</p>}
      </form>
      <p>No account? <a href="/signup">Sign up</a></p>
    </main>
  );
}
