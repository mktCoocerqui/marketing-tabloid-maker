import { requireAdmin } from '@/server/auth';
import { prisma } from '@/server/db';

export default async function AdminHome() {
  const admin = await requireAdmin();
  const [users, products, tabloids, templates] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.tabloid.count(),
    prisma.template.count(),
  ]);
  const cards = [
    { label: 'Usuários', value: users },
    { label: 'Produtos', value: products },
    { label: 'Tabloides', value: tabloids },
    { label: 'Templates', value: templates },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Painel administrador</h1>
        <p className="text-sm text-slate-500">Logado como {admin.email}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border bg-white p-4">
            <p className="text-xs text-slate-400">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-slate-500">
        Próximo: cadastro de produtos (PIM) com upload de imagem. Gestão de usuários, templates e
        campanhas entram nas fatias seguintes.
      </p>
    </div>
  );
}
