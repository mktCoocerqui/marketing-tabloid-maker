'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { requireAdmin } from '@/server/auth';
import { cleanErp, baseNameFromDescription, parseNum, unitFromDescription } from './normalize';

export type ImportRow = {
  erpCode?: string | number | null;
  name: string;
  regularPrice?: string | number | null;
  unit?: string | null;
  erp?: Record<string, unknown>; // dados extras do ERP (curva, comprador, codFamilia...)
};

export type ImportResult = { created: number; updated: number; skipped: number; error?: string };

// Importa um lote de SKUs a partir da aba BASE. Upsert por COD_ERP; agrupa em Produto base
// pelo nome derivado da descrição. Idempotente (subir de novo atualiza, não duplica).
export async function importSkusBatch(rows: ImportRow[]): Promise<ImportResult> {
  await requireAdmin();
  let created = 0, updated = 0, skipped = 0;

  // cache de produto base por nome derivado (dentro do lote)
  const baseCache = new Map<string, string>();
  async function ensureBase(name: string): Promise<string> {
    const cached = baseCache.get(name);
    if (cached) return cached;
    const existing = await prisma.productBase.findFirst({ where: { name }, select: { id: true } });
    const id = existing?.id ?? (await prisma.productBase.create({ data: { name } })).id;
    baseCache.set(name, id);
    return id;
  }

  // Pré-consulta os COD_ERP já existentes (1 query) p/ contar created vs updated.
  const codes = rows.map((r) => cleanErp(r.erpCode)).filter((c): c is string => !!c);
  const existingCodes = new Set(
    (await prisma.sku.findMany({ where: { erpCode: { in: codes } }, select: { erpCode: true } }))
      .map((s) => s.erpCode as string),
  );

  for (const row of rows) {
    const name = String(row.name ?? '').trim();
    if (!name) { skipped++; continue; }

    const erpCode = cleanErp(row.erpCode);
    const productBaseId = await ensureBase(baseNameFromDescription(name));
    const regularPrice = parseNum(row.regularPrice);
    const unit = (row.unit && String(row.unit).trim()) || unitFromDescription(name);
    const erpData = row.erp && Object.keys(row.erp).length ? (row.erp as Prisma.InputJsonValue) : undefined;

    const data = {
      name,
      unit: unit ?? null,
      regularPrice: regularPrice != null ? new Prisma.Decimal(regularPrice) : null,
      productBaseId,
      ...(erpData ? { erpData } : {}),
    };

    if (erpCode) {
      await prisma.sku.upsert({ where: { erpCode }, update: data, create: { erpCode, ...data } });
      if (existingCodes.has(erpCode)) updated++; else created++;
    } else {
      await prisma.sku.create({ data });
      created++;
    }
  }

  revalidatePath('/admin/produtos');
  return { created, updated, skipped };
}
