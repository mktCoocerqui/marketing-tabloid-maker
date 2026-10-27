'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/server/db';
import { requireAdmin } from '@/server/auth';
import { uploadImage } from '@/server/storage';
import { cleanErp } from '@/modules/import/normalize';

const CT: Record<string, string> = { png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

// Quais COD_ERP (dos nomes de arquivo) existem como apresentação.
export async function matchErpCodes(erpCodes: string[]): Promise<string[]> {
  await requireAdmin();
  const found = await prisma.sku.findMany({
    where: { erpCode: { in: erpCodes } }, select: { erpCode: true },
  });
  return found.map((s) => s.erpCode as string);
}

// Sobe UMA imagem (base64) e seta Sku.imageUrl, casando pelo COD_ERP do nome do arquivo.
export async function uploadSkuImage(
  erpCode: string, ext: string, dataBase64: string,
): Promise<{ ok: boolean; matched: boolean; error?: string }> {
  await requireAdmin();
  const code = cleanErp(erpCode);
  if (!code) return { ok: false, matched: false, error: 'COD_ERP inválido.' };
  const sku = await prisma.sku.findUnique({ where: { erpCode: code }, select: { id: true } });
  if (!sku) return { ok: false, matched: false };
  const e = CT[ext] ? ext : 'jpg';
  try {
    const bytes = Buffer.from(dataBase64, 'base64');
    const url = await uploadImage(`sku/${code}.${e}`, bytes, CT[e] ?? 'image/jpeg');
    await prisma.sku.update({ where: { id: sku.id }, data: { imageUrl: url } });
    revalidatePath('/admin/produtos');
    return { ok: true, matched: true };
  } catch (err) {
    return { ok: false, matched: true, error: err instanceof Error ? err.message : 'Falha no upload.' };
  }
}
