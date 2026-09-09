'use server';

import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { requireAdmin } from '@/server/auth';
import { cleanErp, baseNameFromDescription, parseNum, unitFromDescription } from './normalize';

export type OfferRow = {
  erpCode?: string | number | null;
  name: string;
  de?: string | number | null;        // PREÇO PADRAO
  por?: string | number | null;       // PREÇO DIRIGIDA
  cooperado?: string | number | null; // Menor Preço
  obs?: string | null;                // OBSERVAÇÃO
  band?: string | null;               // ESPAÇO (faixa/categoria)
  comprador?: string | null;
  familia?: string | null;
};

export type OfferImportResult = {
  skusCreated: number; skusUpdated: number; offers: number; skipped: number; error?: string;
};

// Zera as ofertas de uma campanha (para reimportar sem duplicar).
export async function resetCampaignOffers(campaign: string): Promise<{ deleted: number }> {
  await requireAdmin();
  const res = await prisma.offer.deleteMany({ where: { campaign } });
  return { deleted: res.count };
}

// Importa um lote de linhas de uma campanha: upsert de SKU por COD_ERP + cria a Oferta.
export async function importCampaignBatch(campaign: string, rows: OfferRow[]): Promise<OfferImportResult> {
  await requireAdmin();
  let skusCreated = 0, skusUpdated = 0, offers = 0, skipped = 0;

  const baseCache = new Map<string, string>();
  async function ensureBase(name: string): Promise<string> {
    const c = baseCache.get(name);
    if (c) return c;
    const e = await prisma.productBase.findFirst({ where: { name }, select: { id: true } });
    const id = e?.id ?? (await prisma.productBase.create({ data: { name } })).id;
    baseCache.set(name, id);
    return id;
  }

  for (const row of rows) {
    const name = String(row.name ?? '').trim();
    if (!name) { skipped++; continue; }

    const erpCode = cleanErp(row.erpCode);
    const productBaseId = await ensureBase(baseNameFromDescription(name));
    const unit = unitFromDescription(name);

    // upsert do SKU
    let skuId: string;
    const skuData = { name, unit: unit ?? undefined, productBaseId };
    if (erpCode) {
      const existing = await prisma.sku.findUnique({ where: { erpCode }, select: { id: true } });
      if (existing) { await prisma.sku.update({ where: { erpCode }, data: skuData }); skuId = existing.id; skusUpdated++; }
      else { skuId = (await prisma.sku.create({ data: { erpCode, ...skuData } })).id; skusCreated++; }
    } else {
      skuId = (await prisma.sku.create({ data: skuData })).id; skusCreated++;
    }

    // preços e dinâmica
    const de = parseNum(row.de), por = parseNum(row.por), coop = parseNum(row.cooperado);
    const obs = String(row.obs ?? '').trim();
    const band = String(row.band ?? '').trim();
    const dyn: Record<string, unknown> = {};
    if (coop != null) dyn.cooperado = coop;
    const limite = obs.match(/LIMITE\s*(\d+)/i)?.[1];
    if (limite) dyn.limite = Number(limite);
    const juntar = obs.match(/JUNTAR\s+(.+)/i)?.[1];
    if (juntar) dyn.juntar = juntar.trim();
    if (obs) dyn.obs = obs;

    const type = de != null && por != null && de !== por ? 'de-por' : 'simple';
    const priority = /DESTAQUE/i.test(band) ? 80 : 10;

    await prisma.offer.create({
      data: {
        skuId,
        typeId: type,
        title: name,
        previousPrice: de != null ? new Prisma.Decimal(de) : null,
        price: por != null ? new Prisma.Decimal(por) : (de != null ? new Prisma.Decimal(de) : null),
        dynamicData: Object.keys(dyn).length ? (dyn as Prisma.InputJsonValue) : undefined,
        campaign,
        priority,
        metadata: { band: band || null, comprador: row.comprador || null, familia: row.familia || null } as Prisma.InputJsonValue,
      },
    });
    offers++;
  }

  revalidatePath('/admin/produtos');
  revalidatePath('/admin/campanhas');
  return { skusCreated, skusUpdated, offers, skipped };
}
