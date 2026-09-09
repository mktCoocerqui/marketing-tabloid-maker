'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProductBaseAction } from './actions';

export function NewProductDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null);
    const res = await createProductBaseAction({}, new FormData(e.currentTarget));
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setOpen(false);
    if (res.id) router.push(`/admin/produtos/${res.id}`);
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90">
        Novo produto
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Novo produto</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <p className="mt-1 text-xs text-slate-400">Ex.: “Carne Bovina Acém”. As apresentações (KG, bandeja…) entram depois.</p>
            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <input name="name" required placeholder="Nome do produto" className="w-full rounded-md border px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input name="category" placeholder="Categoria (ex.: Carnes)" className="rounded-md border px-3 py-2 text-sm" />
                <input name="subcategory" placeholder="Subcategoria" className="rounded-md border px-3 py-2 text-sm" />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setOpen(false)} className="rounded-md border px-4 py-2 text-sm text-slate-600">Cancelar</button>
                <button type="submit" disabled={loading} className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
                  {loading ? 'Criando…' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
