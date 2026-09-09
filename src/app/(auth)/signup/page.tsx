'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUpAction } from '../actions';
import { createSupabaseBrowserClient } from '@/server/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await signUpAction({}, form);
    if (res.error) {
      setLoading(false);
      setError(res.error);
      return;
    }
    // Cria a sessão logo após o cadastro.
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithPassword({
      email: String(form.get('email')).trim().toLowerCase(),
      password: String(form.get('password')),
    });
    setLoading(false);
    router.replace('/');
    router.refresh();
  }

  return (
    <div className="mx-auto mt-16 max-w-sm">
      <h1 className="text-xl font-semibold">Criar conta</h1>
      <p className="mt-1 text-sm text-slate-500">O primeiro acesso vira administrador.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-3">
        <input name="name" placeholder="Nome" className="w-full rounded-md border px-3 py-2 text-sm" />
        <input name="email" type="email" required placeholder="E-mail" className="w-full rounded-md border px-3 py-2 text-sm" />
        <input name="password" type="password" required minLength={6} placeholder="Senha (mín. 6)" className="w-full rounded-md border px-3 py-2 text-sm" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {loading ? 'Criando…' : 'Criar conta'}
        </button>
      </form>
      <p className="mt-4 text-xs text-slate-400">
        Já tem conta? <Link href="/login" className="text-brand underline">Entrar</Link>
      </p>
    </div>
  );
}
