'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { requireAdmin } from '@/server/auth';

/** Converte "12,90" / "12.90" / "" em Prisma.Decimal | null. */
function toDecimal(v: FormDataEntryValue | null): Prisma.Decimal | null {
  const s = String(v ?? '').trim().replace(/\s/g, '').replace(',', '.');
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? new Prisma.Decimal(n) : null;
}

export type FormState = { error?: string; ok?: boolean; id?: string };

// ─────────────── Produto base (família) ───────────────
const baseSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome do produto.').max(160),
  category: z.string().trim().max(80).optional(),
  subcategory: z.string().trim().max(80).optional(),
});

export async function createProductBaseAction(_p: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = baseSchema.safeParse({
    name: fd.get('name'), category: fd.get('category') || undefined, subcategory: fd.get('subcategory') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  const base = await prisma.productBase.create({
    data: { name: parsed.data.name, category: parsed.data.category ?? null, subcategory: parsed.data.subcategory ?? null },
  });
  revalidatePath('/admin/produtos');
  return { ok: true, id: base.id };
}

export async function updateProductBaseAction(id: string, _p: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = baseSchema.safeParse({
    name: fd.get('name'), category: fd.get('category') || undefined, subcategory: fd.get('subcategory') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  await prisma.productBase.update({
    where: { id },
    data: {
      name: parsed.data.name,
      category: parsed.data.category ?? null,
      subcategory: parsed.data.subcategory ?? null,
      description: (String(fd.get('description') ?? '').trim() || null),
    },
  });
  revalidatePath(`/admin/produtos/${id}`);
  return { ok: true };
}

// ─────────────── SKU / Apresentação ───────────────
const skuSchema = z.object({
  productBaseId: z.string().min(1),
  name: z.string().trim().min(1, 'Informe o nome da apresentação.').max(200),
  erpCode: z.string().trim().max(60).optional(),
  barcode: z.string().trim().max(60).optional(),
  unit: z.string().trim().max(20).optional(),
});

export async function createSkuAction(_p: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = skuSchema.safeParse({
    productBaseId: fd.get('productBaseId'), name: fd.get('name'),
    erpCode: fd.get('erpCode') || undefined, barcode: fd.get('barcode') || undefined, unit: fd.get('unit') || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  try {
    await prisma.sku.create({
      data: {
        productBaseId: parsed.data.productBaseId,
        name: parsed.data.name,
        erpCode: parsed.data.erpCode ?? null,
        barcode: parsed.data.barcode ?? null,
        unit: parsed.data.unit ?? null,
        regularPrice: toDecimal(fd.get('regularPrice')),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { error: `Já existe uma apresentação com o COD_ERP "${parsed.data.erpCode}".` };
    }
    throw e;
  }
  revalidatePath(`/admin/produtos/${parsed.data.productBaseId}`);
  return { ok: true };
}

export async function updateSkuAction(id: string, baseId: string, _p: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  try {
    await prisma.sku.update({
      where: { id },
      data: {
        name: String(fd.get('name') ?? '').trim() || undefined,
        erpCode: (String(fd.get('erpCode') ?? '').trim() || null),
        barcode: (String(fd.get('barcode') ?? '').trim() || null),
        unit: (String(fd.get('unit') ?? '').trim() || null),
        regularPrice: toDecimal(fd.get('regularPrice')),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return { error: 'COD_ERP já usado por outra apresentação.' };
    }
    throw e;
  }
  revalidatePath(`/admin/produtos/${baseId}`);
  return { ok: true };
}
