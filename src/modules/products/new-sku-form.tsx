'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSkuAction } from './actions';

export function NewSkuForm({ productBaseId }: { productBaseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set('productBaseId', productBaseId);
    const res = await createSkuAction({}, fd);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    e.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border bg-slate-50 p-3">
      <p className="mb-2 text-sm font-medium">Nova apresentação</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
        <input name="name" required placeholder="Nome (ex.: Acém KG)" className="rounded-md border px-3 py-2 text-sm sm:col-span-2" />
        <input name="erpCode" placeholder="COD_ERP" className="rounded-md border px-3 py-2 text-sm" />
        <input name="unit" placeholder="Unid. (KG/UN)" className="rounded-md border px-3 py-2 text-sm" />
        <input name="regularPrice" placeholder="Preço reg." className="rounded-md border px-3 py-2 text-sm" />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <input name="barcode" placeholder="Código de barras (opcional)" className="w-full rounded-md border px-3 py-2 text-sm" />
        <button type="submit" disabled={loading}
          className="shrink-0 rounded-md bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
          {loading ? 'Adicionando…' : 'Adicionar'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
