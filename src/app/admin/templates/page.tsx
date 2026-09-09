import { requireAdmin } from '@/server/auth';
import { prisma } from '@/server/db';

export default async function TemplatesPage() {
  await requireAdmin();
  const [templates, formats] = await Promise.all([
    prisma.template.findMany({ orderBy: { name: 'asc' }, include: { format: true } }),
    prisma.pageFormat.findMany({ orderBy: { label: 'asc' } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Templates</h1>
        <p className="text-sm text-slate-500">Estruturas visuais reutilizáveis (faixas por categoria, frames de oferta).</p>
      </div>
      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-slate-400">
          Ainda não há templates. O editor de templates (com frames de oferta) entra na fatia do editor visual.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-lg border bg-white p-3">
              <p className="font-medium">{t.name}</p>
              <p className="mt-1 text-xs text-slate-400">{t.format.label}</p>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-slate-400">Formatos disponíveis: {formats.map((f) => f.label).join(' · ')}.</p>
    </div>
  );
}
