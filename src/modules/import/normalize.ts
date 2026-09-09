// Utilitários de normalização para importação do Excel (aba BASE).

// Tokens de embalagem/unidade/qualificadores que NÃO fazem parte do "produto base".
const STOP = new Set([
  'KG','UN','G','GR','ML','L','CX','PCT','PC','BDJ','BANDEJA','GRN','FRESCO','CONG',
  'CONGELADO','RESF','RESFRIADO','PECA','PECAS','FATIADO','FATIADA','TP','LT','RF','GF',
  'PT','SACHE','SACHÊ','GRANEL','A','VACUO','VÁCUO','C','S','DE','DO','DA',
]);

/** Limpa COD_ERP: "3.0" -> "3"; mantém strings não numéricas. */
export function cleanErp(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const m = s.match(/^(\d+)([.,]0+)?$/);
  return m ? m[1] : s;
}

/** Nome do "produto base" (família) derivado da descrição do SKU. */
export function baseNameFromDescription(desc: string): string {
  let s = (desc || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  s = s.replace(/[./,]/g, ' ');
  // remove tokens de tamanho: 5KG, 500G, 1L, 350ML, 1,6KG...
  s = s.replace(/\b\d+([.,]\d+)?\s?(KG|G|GR|ML|L|UN|CX|PCT)\b/g, ' ');
  s = s.replace(/\bC\/OSSO\b|\bS\/OSSO\b/g, ' ');
  s = s.replace(/\b\d+([.,]\d+)?\b/g, ' '); // números soltos
  const tokens = s.split(/\s+/).filter((t) => t && !STOP.has(t));
  const name = tokens.join(' ').trim();
  return name || (desc || '').trim().toUpperCase() || 'PRODUTO';
}

/** Converte "12,90"/"12.90"/number em number|null. */
export function parseNum(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Tenta inferir a unidade a partir do fim da descrição. */
export function unitFromDescription(desc: string): string | null {
  const m = (desc || '').toUpperCase().match(/\b(KG|UN|L|ML|G|CX|PCT|BDJ)\b(?!.*\b(KG|UN|L|ML|G|CX|PCT|BDJ)\b)/);
  return m ? m[1] : null;
}
