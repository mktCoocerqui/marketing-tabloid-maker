import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/server/auth';
import { prisma } from '@/server/db';
import { NewSkuForm } from '@/modules/products/new-sku-form';

function fmtPrice(v: unknown): string {
  if (v == null) return '—';
  const n = Number(v);
  return Number.isFinite(n) ? `R$ ${n.toFixed(2).replace('.', ',')}` : '—';
}

export default async function ProdutoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const base = await prisma.productBase.findUnique({
    where: { id },
    include: {
      skus: {
        orderBy: { name: 'asc' },
        include: { _count: { select: { offers: true } } },
      },
    },
  });
  if (!base) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/produtos" className="text-xs text-slate-400 hover:text-brand">← Produtos</Link>
        <h1 className="text-2xl font-semibold">{base.name}</h1>
        <p className="text-sm text-slate-500">
          {[base.category, base.subcategory].filter(Boolean).join(' · ') || 'Sem categoria'} · {base.skus.length} apresentação(ões)
        </p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-600">Apresentações</h2>
        {base.skus.length === 0 ? (
          <p className="mb-3 rounded-lg border border-dashed bg-white p-4 text-sm text-slate-400">
            Nenhuma apresentação. Adicione a primeira abaixo (ex.: “Acém KG”, COD_ERP 2900).
          </p>
        ) : (
          <div className="mb-3 overflow-hidden rounded-lg border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2">Apresentação</th>
                  <th className="px-3 py-2">COD_ERP</th>
                  <th className="px-3 py-2">Unid.</th>
                  <th className="px-3 py-2">Preço reg.</th>
                  <th className="px-3 py-2">Ofertas</th>
                </tr>
              </thead>
              <tbody>
                {base.skus.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-3 py-2 font-medium">{s.name}</td>
                    <td className="px-3 py-2 text-slate-500">{s.erpCode ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{s.unit ?? '—'}</td>
                    <td className="px-3 py-2 text-slate-500">{fmtPrice(s.regularPrice)}</td>
                    <td className="px-3 py-2 text-slate-500">{s._count.offers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <NewSkuForm productBaseId={base.id} />
      </div>
    </div>
  );
}
