import Link from 'next/link';
import { prisma } from '@/server/db';
import { requireProfile } from '@/server/auth';
import { NewTabloidDialog } from '@/modules/tabloids/new-tabloid-dialog';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Rascunho',
  IN_REVIEW: 'Em revisão',
  APPROVED: 'Aprovado',
  ARCHIVED: 'Arquivado',
};

export default async function DashboardPage() {
  await requireProfile();

  const [formats, recent, inReview, approved] = await Promise.all([
    prisma.pageFormat.findMany({ orderBy: { label: 'asc' } }),
    prisma.tabloid.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 12,
      include: { format: true },
    }),
    prisma.tabloid.count({ where: { status: 'IN_REVIEW' } }),
    prisma.tabloid.count({ where: { status: 'APPROVED' } }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-500">Crie e gerencie seus tabloides promocionais.</p>
        </div>
        <NewTabloidDialog formats={formats} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-400">Tabloides</p>
          <p className="mt-1 text-2xl font-semibold">{recent.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-400">Aguardando revisão</p>
          <p className="mt-1 text-2xl font-semibold">{inReview}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs text-slate-400">Aprovados</p>
          <p className="mt-1 text-2xl font-semibold">{approved}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-slate-600">Tabloides recentes</h2>
        {recent.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-slate-400">
            Nenhum tabloide ainda. Clique em <span className="font-medium text-slate-600">Novo tabloide</span> para começar.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((t) => (
              <Link
                key={t.id}
                href={`/tabloids/${t.id}`}
                className="rounded-lg border bg-white p-4 transition hover:border-brand hover:shadow-sm"
              >
                <p className="font-medium">{t.name}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {t.format.label} · {STATUS_LABEL[t.status] ?? t.status}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
