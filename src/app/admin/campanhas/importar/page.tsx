'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { importCampaignBatch, resetCampaignOffers, type OfferRow } from '@/modules/import/offer-actions';
import { cleanErp } from '@/modules/import/normalize';

type MapKeys = 'cod' | 'desc' | 'de' | 'por' | 'coop' | 'obs' | 'band' | 'comprador' | 'familia';

const AUTO: Record<MapKeys, string[]> = {
  cod: ['COD', 'COD_ERP'],
  desc: ['DESCRICAO', 'DESCRIÇÃO'],
  de: ['PREÇO PADRAO', 'PRECO PADRAO'],
  por: ['PREÇO DIRIGIDA', 'PRECO DIRIGIDA'],
  coop: ['MENOR PREÇO', 'MENOR PRECO'],
  obs: ['OBSERVAÇÃO', 'OBSERVACAO'],
  band: ['ESPAÇO', 'ESPACO'],
  comprador: ['COMPRADOR'],
  familia: ['FAMILIA'],
};

function findCol(headers: string[], candidates: string[]): number {
  const H = headers.map((s) => s.trim().toUpperCase());
  for (const c of candidates) { const i = H.indexOf(c.toUpperCase()); if (i >= 0) return i; }
  return -1;
}

const CHUNK = 200;

export default function ImportarCampanhaPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState('');
  const [campaign, setCampaign] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [dataRows, setDataRows] = useState<unknown[][]>([]);
  const [map, setMap] = useState<Record<MapKeys, number>>({ cod: -1, desc: -1, de: -1, por: -1, coop: -1, obs: -1, band: -1, comprador: -1, familia: -1 });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [result, setResult] = useState<{ skusCreated: number; skusUpdated: number; offers: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null); setResult(null);
    setFileName(file.name);
    setCampaign(file.name.replace(/\.(csv|xlsx|xls)$/i, ''));

    let rows: unknown[][];
    if (/\.csv$/i.test(file.name)) {
      // PapaParse mantém tudo como string — preserva decimais BR ("5,89") sem virar 589.
      const text = await file.text();
      const parsed = Papa.parse<string[]>(text, { skipEmptyLines: false });
      rows = parsed.data as unknown[][];
    } else {
      const ab = await file.arrayBuffer();
      const book = XLSX.read(ab, { type: 'array' });
      const ws = book.Sheets[book.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, blankrows: false, defval: null });
    }
    const hdr = ((rows[0] as unknown[]) ?? []).map((c) => String(c ?? '').trim());
    setHeaders(hdr);
    setDataRows(rows.slice(1));
    setMap({
      cod: findCol(hdr, AUTO.cod), desc: findCol(hdr, AUTO.desc), de: findCol(hdr, AUTO.de),
      por: findCol(hdr, AUTO.por), coop: findCol(hdr, AUTO.coop), obs: findCol(hdr, AUTO.obs),
      band: findCol(hdr, AUTO.band), comprador: findCol(hdr, AUTO.comprador), familia: findCol(hdr, AUTO.familia),
    });
  }

  // Constrói as linhas válidas, preenchendo a faixa (band) para baixo e ignorando lixo.
  function buildRows(): OfferRow[] {
    const out: OfferRow[] = [];
    let lastBand = '';
    const cell = (r: unknown[], i: number) => (i >= 0 ? r[i] : null);
    for (const r of dataRows) {
      if (!Array.isArray(r)) continue;
      const bandRaw = String(cell(r, map.band) ?? '').trim();
      if (bandRaw && bandRaw !== '#N/A') lastBand = bandRaw;
      const cod = cleanErp(cell(r, map.cod));
      const name = String(cell(r, map.desc) ?? '').trim();
      if (!cod || !name) continue; // ignora separadores, #N/A e resumo do rodapé
      out.push({
        erpCode: cod, name,
        de: cell(r, map.de) as string | null, por: cell(r, map.por) as string | null,
        cooperado: cell(r, map.coop) as string | null, obs: String(cell(r, map.obs) ?? '') || null,
        band: lastBand || null, comprador: String(cell(r, map.comprador) ?? '') || null,
        familia: String(cell(r, map.familia) ?? '') || null,
      });
    }
    return out;
  }

  async function onImport() {
    setError(null); setResult(null);
    if (map.cod < 0 || map.desc < 0) { setError('Selecione as colunas COD e Descrição.'); return; }
    if (!campaign.trim()) { setError('Informe o nome da campanha.'); return; }
    const rows = buildRows();
    if (rows.length === 0) { setError('Nenhuma oferta válida encontrada.'); return; }
    setBusy(true);
    setProgress({ done: 0, total: rows.length });
    const acc = { skusCreated: 0, skusUpdated: 0, offers: 0 };
    try {
      await resetCampaignOffers(campaign.trim()); // reimport substitui as ofertas da campanha
      for (let i = 0; i < rows.length; i += CHUNK) {
        const res = await importCampaignBatch(campaign.trim(), rows.slice(i, i + CHUNK));
        if (res.error) throw new Error(res.error);
        acc.skusCreated += res.skusCreated; acc.skusUpdated += res.skusUpdated; acc.offers += res.offers;
        setProgress({ done: Math.min(i + CHUNK, rows.length), total: rows.length });
      }
      setResult(acc);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na importação.');
    } finally { setBusy(false); }
  }

  const preview = buildRows().slice(0, 15);
  const validCount = headers.length ? buildRows().length : 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/campanhas" className="text-xs text-slate-400 hover:text-brand">← Campanhas</Link>
        <h1 className="text-2xl font-semibold">Importar campanha (CSV)</h1>
        <p className="text-sm text-slate-500">
          Sobe o CSV da campanha: cria/atualiza os produtos por <b>COD</b> e gera as <b>ofertas</b> (De/Por, faixa, limites).
        </p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <input type="file" accept=".csv,.xlsx,.xls" onChange={onFile}
          className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-medium file:text-white" />
        {fileName && <p className="mt-2 text-xs text-slate-400">{fileName}</p>}
      </div>

      {headers.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="text-sm sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-slate-600">Nome da campanha</span>
              <input value={campaign} onChange={(e) => setCampaign(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
            </label>
            {([['cod', 'COD *'], ['desc', 'Descrição *'], ['de', 'De (PADRAO)'], ['por', 'Por (DIRIGIDA)'], ['coop', 'Cooperado'], ['obs', 'Observação'], ['band', 'Faixa (ESPAÇO)']] as [MapKeys, string][]).map(([k, label]) => (
              <label key={k} className="text-sm">
                <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
                <select value={map[k]} onChange={(e) => setMap((m) => ({ ...m, [k]: Number(e.target.value) }))}
                  className="w-full rounded-md border bg-white px-2 py-2 text-sm">
                  <option value={-1}>—</option>
                  {headers.map((h, i) => <option key={i} value={i}>{h || `Col ${i + 1}`}</option>)}
                </select>
              </label>
            ))}
          </div>

          <div className="overflow-x-auto rounded-lg border bg-white">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr><th className="px-3 py-2">COD</th><th className="px-3 py-2">Descrição</th><th className="px-3 py-2">De</th><th className="px-3 py-2">Por</th><th className="px-3 py-2">Faixa</th></tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-3 py-1.5 text-slate-500">{String(r.erpCode)}</td>
                    <td className="px-3 py-1.5 font-medium">{r.name}</td>
                    <td className="px-3 py-1.5 text-slate-500">{r.de ? String(r.de) : '—'}</td>
                    <td className="px-3 py-1.5 text-slate-500">{r.por ? String(r.por) : '—'}</td>
                    <td className="px-3 py-1.5 text-brand">{r.band ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onImport} disabled={busy} className="rounded-md bg-brand px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
              {busy ? 'Importando…' : `Importar ${validCount} oferta(s)`}
            </button>
            {progress && busy && <span className="text-sm text-slate-500">{progress.done} / {progress.total}</span>}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {result && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              Concluído: <b>{result.offers}</b> oferta(s) · produtos {result.skusCreated} novo(s), {result.skusUpdated} atualizado(s).{' '}
              <Link href="/admin/produtos" className="underline">Ver produtos</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
