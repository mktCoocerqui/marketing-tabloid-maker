'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { importSkusBatch, type ImportRow } from '@/modules/import/actions';
import { baseNameFromDescription, cleanErp } from '@/modules/import/normalize';

// Colunas do ERP capturadas automaticamente em erpData (por cabeçalho).
const ERP_COLS: Record<string, string> = {
  CURVA: 'curva',
  NOME_COMPRADOR: 'comprador',
  COMPRADOR: 'comprador',
  'PARAMETRO FAMILIA': 'parametroFamilia',
  COD_FAMILIA: 'codFamilia',
  CUSTO: 'custo',
  'VOLUME MEDIO': 'volumeMedio',
};

function findCol(headers: string[], candidates: string[]): number {
  const norm = (s: string) => s.trim().toUpperCase();
  const H = headers.map(norm);
  for (const c of candidates) {
    const i = H.indexOf(norm(c));
    if (i >= 0) return i;
  }
  return -1;
}

const CHUNK = 400;

export default function ImportarPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [buf, setBuf] = useState<ArrayBuffer | null>(null);
  const [sheet, setSheet] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<unknown[][]>([]);
  const [map, setMap] = useState({ erp: -1, name: -1, price: -1 });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null); setResult(null);
    setFileName(file.name);
    const ab = await file.arrayBuffer();
    setBuf(ab);
    // Lê só os nomes das abas (rápido), sem materializar as 324 planilhas.
    const meta = XLSX.read(ab, { type: 'array', bookSheets: true });
    setSheetNames(meta.SheetNames);
    const preferred = meta.SheetNames.find((n) => n.trim().toUpperCase() === 'BASE') ?? meta.SheetNames[0];
    loadSheet(ab, preferred);
  }

  function loadSheet(ab: ArrayBuffer, name: string) {
    setSheet(name);
    // Lê apenas a aba selecionada.
    const book = XLSX.read(ab, { type: 'array', sheets: [name] });
    const ws = book.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false, defval: null });
    const hdr = (rows[0] ?? []).map((c) => String(c ?? '').trim());
    const body = rows.slice(1).filter((r) => Array.isArray(r) && r.some((c) => c != null && c !== ''));
    setHeaders(hdr);
    setDataRows(body);
    setMap({
      erp: findCol(hdr, ['COD_ERP', 'COD ERP', 'CODIGO', 'COD']),
      name: findCol(hdr, ['DESCRICAO', 'DESCRIÇÃO', 'PRODUTO', 'DESCRICAO PRODUTO']),
      price: findCol(hdr, ['PRECO', 'PREÇO', 'PRECO REGULAR', 'PREÇO REGULAR', 'PREÇO PADRAO', 'PRECO PADRAO']),
    });
  }

  function buildRows(): ImportRow[] {
    const erpKeyByIndex: { idx: number; key: string }[] = [];
    headers.forEach((h, i) => {
      const key = ERP_COLS[h.trim().toUpperCase()];
      if (key) erpKeyByIndex.push({ idx: i, key });
    });
    return dataRows
      .map((r) => {
        const name = map.name >= 0 ? String(r[map.name] ?? '').trim() : '';
        if (!name) return null;
        const erp: Record<string, unknown> = {};
        for (const { idx, key } of erpKeyByIndex) if (r[idx] != null && r[idx] !== '') erp[key] = r[idx];
        return {
          erpCode: map.erp >= 0 ? (r[map.erp] as string | number | null) : null,
          name,
          regularPrice: map.price >= 0 ? (r[map.price] as string | number | null) : null,
          erp,
        } as ImportRow;
      })
      .filter((x): x is ImportRow => x !== null);
  }

  async function onImport() {
    setError(null); setResult(null);
    if (map.name < 0) { setError('Selecione a coluna de Descrição.'); return; }
    const rows = buildRows();
    if (rows.length === 0) { setError('Nenhuma linha válida encontrada.'); return; }
    setBusy(true);
    setProgress({ done: 0, total: rows.length });
    const acc = { created: 0, updated: 0, skipped: 0 };
    try {
      for (let i = 0; i < rows.length; i += CHUNK) {
        const res = await importSkusBatch(rows.slice(i, i + CHUNK));
        if (res.error) throw new Error(res.error);
        acc.created += res.created; acc.updated += res.updated; acc.skipped += res.skipped;
        setProgress({ done: Math.min(i + CHUNK, rows.length), total: rows.length });
      }
      setResult(acc);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na importação.');
    } finally {
      setBusy(false);
    }
  }

  const previewRows = dataRows.slice(0, 12);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/produtos" className="text-xs text-slate-400 hover:text-brand">← Produtos</Link>
        <h1 className="text-2xl font-semibold">Importar Excel (aba BASE)</h1>
        <p className="text-sm text-slate-500">
          Sobe o <code>.xlsx</code> e o catálogo se popula por <b>COD_ERP</b>: cria o que é novo e atualiza o que já existe.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <input type="file" accept=".xlsx,.xls" onChange={onFile}
          className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-medium file:text-white" />
        {fileName && <p className="mt-2 text-xs text-slate-400">{fileName} · {sheetNames.length} aba(s)</p>}
      </div>

      {buf && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">Aba</span>
              <select value={sheet} onChange={(e) => buf && loadSheet(buf, e.target.value)} className="w-full rounded-md border bg-white px-2 py-2 text-sm">
                {sheetNames.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            {([['erp', 'COD_ERP'], ['name', 'Descrição *'], ['price', 'Preço regular']] as const).map(([k, label]) => (
              <label key={k} className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
                <select value={map[k]} onChange={(e) => setMap((m) => ({ ...m, [k]: Number(e.target.value) }))}
                  className="w-full rounded-md border bg-white px-2 py-2 text-sm">
                  <option value={-1}>—</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h || `Coluna ${i + 1}`}</option>)}
                </select>
              </label>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-3 py-2">COD_ERP</th>
                  <th className="px-3 py-2">Descrição</th>
                  <th className="px-3 py-2">Preço</th>
                  <th className="px-3 py-2">→ Produto (derivado)</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((r, i) => {
                  const name = map.name >= 0 ? String(r[map.name] ?? '') : '';
                  return (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-1.5 text-slate-500">{map.erp >= 0 ? cleanErp(r[map.erp]) ?? '—' : '—'}</td>
                      <td className="px-3 py-1.5 font-medium">{name || '—'}</td>
                      <td className="px-3 py-1.5 text-slate-500">{map.price >= 0 ? String(r[map.price] ?? '—') : '—'}</td>
                      <td className="px-3 py-1.5 text-brand">{name ? baseNameFromDescription(name) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onImport} disabled={busy}
              className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
              {busy ? 'Importando…' : `Importar ${dataRows.length} linha(s)`}
            </button>
            {progress && busy && (
              <span className="text-sm text-slate-500">{progress.done} / {progress.total}</span>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {result && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              Importação concluída: <b>{result.created}</b> criada(s), <b>{result.updated}</b> atualizada(s)
              {result.skipped ? <>, {result.skipped} ignorada(s)</> : null}.{' '}
              <Link href="/admin/produtos" className="underline">Ver produtos</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
