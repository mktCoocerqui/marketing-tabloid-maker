import Link from 'next/link';
import { requireAdmin } from '@/server/auth';
import { prisma } from '@/server/db';

const STATUS: Record<string, string> = { DRAFT: 'Rascunho', IN_REVIEW: 'Em revisão', APPROVED: 'Aprovado', ARCHIVED: 'Arquivado' };

export default async function CampanhasPage() {
  await requireAdmin();
  const tabloids = await prisma.tabloid.findMany({ orderBy: { updatedAt: 'desc' }, include: { format: true }, take: 100 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Campanhas</h1>
          <p className="text-sm text-slate-500">Importe o CSV da campanha (cria produtos + ofertas) e gerencie tabloides.</p>
        </div>
        <Link href="/admin/campanhas/importar"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          Importar campanha (CSV)
        </Link>
      </div>
      {tabloids.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-slate-400">Nenhum tabloide ainda.</div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr><th className="px-3 py-2">Nome</th><th className="px-3 py-2">Formato</th><th className="px-3 py-2">Status</th></tr>
            </thead>
            <tbody>
              {tabloids.map((t) => (
                <tr key={t.id} className="border-t hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium"><Link href={`/tabloids/${t.id}`} className="hover:text-brand">{t.name}</Link></td>
                  <td className="px-3 py-2 text-slate-500">{t.format.label}</td>
                  <td className="px-3 py-2"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{STATUS[t.status] ?? t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
