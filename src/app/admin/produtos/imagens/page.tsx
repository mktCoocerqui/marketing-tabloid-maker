'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { listDriveImageMatches, syncDriveImagesBatch, type DriveMatch } from '@/modules/images/drive-actions';

const CHUNK = 15;

export default function ImagensPage() {
  const router = useRouter();
  const [folder, setFolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<{ matches: DriveMatch[]; totalFiles: number; unmatched: number } | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSearch() {
    setError(null); setResult(null); setInfo(null); setLoading(true);
    const res = await listDriveImageMatches(folder);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setInfo({ matches: res.matches, totalFiles: res.totalFiles, unmatched: res.unmatched });
  }

  async function onSync() {
    if (!info) return;
    setError(null); setResult(null); setBusy(true);
    const items = info.matches.map((m) => ({ fileId: m.fileId, skuId: m.skuId, erpCode: m.erpCode, ext: m.ext }));
    setProgress({ done: 0, total: items.length });
    let done = 0;
    try {
      for (let i = 0; i < items.length; i += CHUNK) {
        const res = await syncDriveImagesBatch(items.slice(i, i + CHUNK));
        if (res.error) throw new Error(res.error);
        done += res.done;
        setProgress({ done, total: items.length });
      }
      setResult(done);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na sincronização.');
    } finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/produtos" className="text-xs text-slate-400 hover:text-brand">← Produtos</Link>
        <h1 className="text-2xl font-semibold">Imagens do Drive</h1>
        <p className="text-sm text-slate-500">
          As imagens nomeadas por <b>COD_ERP</b> (ex.: <code>2900.jpg</code>) são casadas com as apresentações e salvas no sistema.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4 space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">Pasta do Drive (link ou ID)</span>
          <input value={folder} onChange={(e) => setFolder(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/XXXX  (vazio = pasta padrão configurada)"
            className="w-full rounded-md border px-3 py-2 text-sm" />
        </label>
        <button onClick={onSearch} disabled={loading}
          className="rounded-md border px-4 py-2 text-sm font-medium text-slate-700 hover:border-brand hover:text-brand disabled:opacity-60">
          {loading ? 'Procurando…' : 'Procurar imagens'}
        </button>
      </div>

      {info && (
        <div className="space-y-3">
          <div className="rounded-lg border bg-white p-4 text-sm">
            <p><b>{info.totalFiles}</b> imagem(ns) na pasta · <b>{info.matches.length}</b> casada(s) com apresentações · {info.unmatched} sem correspondência.</p>
            {info.matches.length > 0 && (
              <p className="mt-1 text-xs text-slate-400">
                {info.matches.filter((m) => m.hasImage).length} já têm imagem (serão substituídas) · {info.matches.filter((m) => !m.hasImage).length} novas.
              </p>
            )}
          </div>

          {info.matches.length > 0 && (
            <>
              <button onClick={onSync} disabled={busy}
                className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
                {busy ? 'Sincronizando…' : `Importar ${info.matches.length} imagem(ns)`}
              </button>
              {progress && busy && <span className="ml-3 text-sm text-slate-500">{progress.done} / {progress.total}</span>}

              <div className="max-h-64 overflow-y-auto rounded-lg border bg-white text-xs">
                <table className="w-full">
                  <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
                    <tr><th className="px-3 py-2">COD_ERP</th><th className="px-3 py-2">Apresentação</th><th className="px-3 py-2">Arquivo</th><th className="px-3 py-2">Status</th></tr>
                  </thead>
                  <tbody>
                    {info.matches.slice(0, 200).map((m) => (
                      <tr key={m.skuId} className="border-t">
                        <td className="px-3 py-1.5 text-slate-500">{m.erpCode}</td>
                        <td className="px-3 py-1.5 font-medium">{m.skuName}</td>
                        <td className="px-3 py-1.5 text-slate-500">{m.fileName}</td>
                        <td className="px-3 py-1.5">{m.hasImage ? <span className="text-amber-600">substitui</span> : <span className="text-green-600">nova</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {result != null && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {result} imagem(ns) sincronizada(s). <Link href="/admin/produtos" className="underline">Ver produtos</Link>
        </div>
      )}
    </div>
  );
}
