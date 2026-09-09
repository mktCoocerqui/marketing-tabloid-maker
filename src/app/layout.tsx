import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { getCurrentProfile } from '@/server/auth';
import { signOutAction } from './(auth)/actions';

export const metadata: Metadata = {
  title: 'Tabloide Maker',
  description: 'Criação e diagramação inteligente de tabloides promocionais',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile().catch(() => null);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">
        <header className="border-b bg-white">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
            <Link href="/" className="text-lg font-semibold text-brand">Tabloide Maker</Link>
            <span className="rounded bg-teal-50 px-2 py-0.5 text-xs text-brand-fg">Fase 1</span>
            <div className="ml-auto flex items-center gap-3 text-sm">
              {profile ? (
                <>
                  {profile.role === 'ADMIN' && (
                    <Link href="/admin" className="text-slate-600 hover:text-brand">Admin</Link>
                  )}
                  <span className="text-slate-400">{profile.email}</span>
                  <form action={signOutAction}>
                    <button className="rounded border px-2 py-1 text-slate-600 hover:bg-slate-50">Sair</button>
                  </form>
                </>
              ) : (
                <Link href="/login" className="text-brand">Entrar</Link>
              )}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
