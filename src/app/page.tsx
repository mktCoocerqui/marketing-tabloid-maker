import Link from 'next/link';

// Dashboard placeholder (fatia 1). As seções (recentes, em revisão, aprovados,
// templates) serão preenchidas nas próximas fatias do MVP.
const sections = [
  { title: 'Tabloides recentes', hint: 'Últimos editados aparecerão aqui.' },
  { title: 'Aguardando revisão', hint: 'Enviados para a equipe (Fase 2).' },
  { title: 'Aprovados', hint: 'Prontos para exportar.' },
  { title: 'Templates', hint: 'Estruturas reutilizáveis.' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Fundação do projeto. Próximas fatias: PIM, editor visual, importação e autodiagramação.
          </p>
        </div>
        <button
          disabled
          className="cursor-not-allowed rounded-md bg-brand px-4 py-2 text-sm font-medium text-white opacity-60"
          title="Disponível na fatia 8"
        >
          Novo tabloide
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <div key={s.title} className="rounded-lg border bg-white p-4">
            <h2 className="text-sm font-medium">{s.title}</h2>
            <p className="mt-2 text-xs text-slate-400">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-white p-4 text-sm text-slate-600">
        <p className="font-medium">Status da fundação</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-slate-500">
          <li>Next.js + TypeScript + Tailwind configurados.</li>
          <li>
            Schema Prisma e cliente prontos. Health check:{' '}
            <Link href="/api/health" className="text-brand underline">
              /api/health
            </Link>
            .
          </li>
          <li>Roadmap e arquitetura em <code>/docs</code>.</li>
        </ul>
      </div>
    </div>
  );
}
