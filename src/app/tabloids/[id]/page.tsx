import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireProfile } from '@/server/auth';
import { prisma } from '@/server/db';

export default async function TabloidPage({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const { id } = await params;

  const tabloid = await prisma.tabloid.findUnique({
    where: { id },
    include: { format: true, pages: { orderBy: { sortOrder: 'asc' } }, _count: { select: { offers: true } } },
  });
  if (!tabloid) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/" className="text-xs text-slate-400 hover:text-brand">← Dashboard</Link>
          <h1 className="text-2xl font-semibold">{tabloid.name}</h1>
          <p className="text-sm text-slate-500">
            {tabloid.format.label} · {tabloid.pages.length} página(s) · {tabloid._count.offers} oferta(s) ·{' '}
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{tabloid.status}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tabloid.pages.map((p, i) => (
          <div key={p.id}
            className="flex aspect-[210/297] items-center justify-center rounded-lg border bg-white text-sm text-slate-400 shadow-sm">
            Página {i + 1}
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-amber-50 p-4 text-sm text-amber-800">
        O editor visual, a importação de Excel e a autodiagramação entram nas próximas fatias.
        Por ora, o tabloide foi criado com páginas em branco no formato escolhido.
      </div>
    </div>
  );
}
