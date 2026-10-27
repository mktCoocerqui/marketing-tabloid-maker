'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { matchErpCodes, uploadSkuImage } from '@/modules/images/upload-actions';
import { cleanErp } from '@/modules/import/normalize';

type Item = { file: File; erp: string; ext: string; status: 'pendente' | 'ok' | 'sem-produto' | 'erro' };

function erpFromName(name: string): { erp: string; ext: string } {
  const base = name.replace(/\.[^.]+$/, '');
  const ext = (name.match(/\.([^.]+)$/)?.[1] ?? 'jpg').toLowerCase();
  return { erp: cleanErp(base) ?? '', ext };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function UploadImagensPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [matched, setMatched] = useState<Set<string> | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    const files = Array.from(e.target.files ?? []);
    const its: Item[] = files.map((file) => {
      const { erp, ext } = erpFromName(file.name);
      return { file, erp, ext, status: 'pendente' as const };
    });
    setItems(its);
    const codes = [...new Set(its.map((i) => i.erp).filter(Boolean))];
    if (codes.length) {
      const found = await matchErpCodes(codes);
      setMatched(new Set(found));
    } else {
      setMatched(new Set());
    }
  }

  async function onUpload() {
    if (!matched) return;
    setBusy(true); setError(null);
    const list = [...items];
    const toSend = list.filter((i) => i.erp && matched.has(i.erp));
    setProgress({ done: 0, total: toSend.length });
    let done = 0;
    for (const it of list) {
      if (!it.erp || !matched.has(it.erp)) { it.status = 'sem-produto'; continue; }
      try {
        const b64 = await fileToBase64(it.file);
        const res = await uploadSkuImage(it.erp, it.ext, b64);
        it.status = res.ok ? 'ok' : res.matched ? 'erro' : 'sem-produto';
      } catch { it.status = 'erro'; }
      done++;
      setProgress({ done, total: toSend.length });
      setItems([...list]);
    }
    setBusy(false);
    router.refresh();
  }

  const matchCount = matched ? items.filter((i) => i.erp && matched.has(i.erp)).length : 0;
  const okCount = items.filter((i) => i.status === 'ok').length;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/produtos" className="text-xs text-slate-400 hover:text-brand">← Produtos</Link>
        <h1 className="text-2xl font-semibold">Enviar imagens (arquivos)</h1>
        <p className="text-sm text-slate-500">
          Baixe a pasta do Drive (vira um <code>.zip</code>), descompacte e selecione as imagens.
          O nome do arquivo deve ser o <b>COD_ERP</b> (ex.: <code>2900.jpg</code>).
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <input type="file" accept="image/*" multiple onChange={onFiles}
          className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-medium file:text-white" />
      </div>

      {items.length > 0 && (
        <>
          <div className="rounded-lg border bg-white p-4 text-sm">
            <b>{items.length}</b> arquivo(s) · <b>{matchCount}</b> casam com apresentações (COD_ERP) · {items.length - matchCount} sem produto correspondente.
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onUpload} disabled={busy || matchCount === 0}
              className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
              {busy ? 'Enviando…' : `Enviar ${matchCount} imagem(ns)`}
            </button>
            {progress && busy && <span className="text-sm text-slate-500">{progress.done} / {progress.total}</span>}
            {okCount > 0 && !busy && <span className="text-sm text-green-700">{okCount} enviada(s) ✓</span>}
          </div>

          <div className="max-h-72 overflow-y-auto rounded-lg border bg-white text-xs">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
                <tr><th className="px-3 py-2">Arquivo</th><th className="px-3 py-2">COD_ERP</th><th className="px-3 py-2">Situação</th></tr>
              </thead>
              <tbody>
                {items.slice(0, 300).map((it, i) => {
                  const willMatch = matched && it.erp && matched.has(it.erp);
                  const label = it.status === 'ok' ? <span className="text-green-600">enviada ✓</span>
                    : it.status === 'erro' ? <span className="text-red-600">erro</span>
                    : it.status === 'sem-produto' || !willMatch ? <span className="text-slate-400">sem produto</span>
                    : <span className="text-brand">pronta</span>;
                  return (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-1.5">{it.file.name}</td>
                      <td className="px-3 py-1.5 text-slate-500">{it.erp || '—'}</td>
                      <td className="px-3 py-1.5">{label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
