'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTabloidAction } from './actions';

type Format = { id: string; label: string; widthMm: number; heightMm: number };

export function NewTabloidDialog({ formats }: { formats: Format[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await createTabloidAction({}, new FormData(e.currentTarget));
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setOpen(false);
    if (res.id) router.push(`/tabloids/${res.id}`);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Novo tabloide
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Novo tabloide</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Nome</label>
                <input name="name" required placeholder="Ex.: Terça e Quarta do Açougue"
                  className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Formato</label>
                <select name="formatId" required defaultValue=""
                  className="w-full rounded-md border bg-white px-3 py-2 text-sm">
                  <option value="" disabled>Selecione…</option>
                  {formats.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label} ({f.widthMm}×{f.heightMm}mm)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Nº de páginas</label>
                <input name="pages" type="number" min={1} max={50} defaultValue={2}
                  className="w-full rounded-md border px-3 py-2 text-sm" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="rounded-md border px-4 py-2 text-sm text-slate-600">Cancelar</button>
                <button type="submit" disabled={loading}
                  className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                  {loading ? 'Criando…' : 'Criar tabloide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
