import { requireAdmin } from '@/server/auth';
import { prisma } from '@/server/db';

const ROLE_LABEL: Record<string, string> = { ADMIN: 'Administrador', EDITOR: 'Editor', REVIEWER: 'Revisor' };

export default async function UsuariosPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Usuários</h1>
        <p className="text-sm text-slate-500">Quem tem acesso à plataforma.</p>
      </div>
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr><th className="px-3 py-2">Nome</th><th className="px-3 py-2">E-mail</th><th className="px-3 py-2">Papel</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2 font-medium">{u.name ?? '—'}</td>
                <td className="px-3 py-2 text-slate-500">{u.email}</td>
                <td className="px-3 py-2"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{ROLE_LABEL[u.role] ?? u.role}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">Convite de novos usuários e edição de papéis entram na próxima iteração do admin.</p>
    </div>
  );
}
