import Link from 'next/link';
import { requireAdmin } from '@/server/auth';

const nav = [
  { href: '/admin', label: 'Visão geral' },
  { href: '/admin/produtos', label: 'Produtos (PIM)' },
  { href: '/admin/templates', label: 'Templates' },
  { href: '/admin/usuarios', label: 'Usuários' },
  { href: '/admin/campanhas', label: 'Campanhas' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin(); // guarda: só ADMIN

  return (
    <div className="grid grid-cols-[220px_1fr] gap-6">
      <aside className="rounded-lg border bg-white p-3">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Admin</p>
        <nav className="space-y-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="block rounded px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section>{children}</section>
    </div>
  );
}
