import Link from 'next/link';
import { requireAdmin } from '@/server/auth';
import { prisma } from '@/server/db';
import { NewProductDialog } from '@/modules/products/new-product-dialog';

export default async function ProdutosPage() {
  await requireAdmin();
  const bases = await prisma.productBase.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { skus: true } } },
    take: 200,
  });

  // Agrupa por categoria para a árvore.
  const byCategory = new Map<string, typeof bases>();
  for (const b of bases) {
    const key = b.category?.trim() || 'Sem categoria';
    (byCategory.get(key) ?? byCategory.set(key, []).get(key)!).push(b);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Produtos</h1>
          <p className="text-sm text-slate-500">Cada produto agrupa suas apresentações (KG, bandeja, fatiado…).</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/produtos/importar"
            className="rounded-md border px-4 py-2 text-sm font-medium text-slate-600 hover:border-brand hover:text-brand">
            Importar Excel
          </Link>
          <NewProductDialog />
        </div>
      </div>

      {bases.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-slate-400">
          Nenhum produto ainda. Clique em <span className="font-medium text-slate-600">Novo produto</span> para começar
          (ou, em breve, importe a aba <code>BASE</code> do Excel).
        </div>
      ) : (
        <div className="space-y-6">
          {[...byCategory.entries()].map(([cat, items]) => (
            <div key={cat}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{cat}</h2>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((b) => (
                  <Link key={b.id} href={`/admin/produtos/${b.id}`}
                    className="rounded-lg border bg-white p-3 transition hover:border-brand hover:shadow-sm">
                    <p className="font-medium">{b.name}</p>
                    <p className="mt-1 text-xs text-slate-400">{b._count.skus} apresentação(ões)</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
