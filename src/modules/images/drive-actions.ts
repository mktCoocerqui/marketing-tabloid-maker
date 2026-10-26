'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/server/db';
import { requireAdmin } from '@/server/auth';
import { listFolderImages, downloadFile, parseFolderId } from '@/server/google/drive';
import { uploadImage } from '@/server/storage';
import { cleanErp } from '@/modules/import/normalize';

export type DriveMatch = {
  fileId: string; fileName: string; ext: string;
  erpCode: string; skuId: string; skuName: string; hasImage: boolean;
};

// Lista a pasta do Drive e casa cada arquivo (nome = COD_ERP) com uma apresentação (SKU).
export async function listDriveImageMatches(folderInput?: string): Promise<{
  matches: DriveMatch[]; totalFiles: number; unmatched: number; error?: string;
}> {
  await requireAdmin();
  const raw = folderInput || process.env.GOOGLE_DRIVE_FOLDER_ID || '';
  if (!raw) return { matches: [], totalFiles: 0, unmatched: 0, error: 'Informe a pasta do Drive.' };
  try {
    const files = await listFolderImages(parseFolderId(raw));
    const byErp = new Map<string, { id: string; ext: string }>();
    for (const f of files) {
      const base = f.name.replace(/\.[^.]+$/, '');
      const ext = (f.name.match(/\.([^.]+)$/)?.[1] ?? 'jpg').toLowerCase();
      const erp = cleanErp(base);
      if (erp && !byErp.has(erp)) byErp.set(erp, { id: f.id, ext });
    }
    const skus = await prisma.sku.findMany({
      where: { erpCode: { in: [...byErp.keys()] } },
      select: { id: true, erpCode: true, name: true, imageUrl: true },
    });
    const matches: DriveMatch[] = [];
    for (const s of skus) {
      const f = s.erpCode ? byErp.get(s.erpCode) : undefined;
      if (!f) continue;
      matches.push({
        fileId: f.id, fileName: `${s.erpCode}.${f.ext}`, ext: f.ext,
        erpCode: s.erpCode!, skuId: s.id, skuName: s.name, hasImage: !!s.imageUrl,
      });
    }
    return { matches, totalFiles: files.length, unmatched: files.length - matches.length };
  } catch (e) {
    return { matches: [], totalFiles: 0, unmatched: 0, error: e instanceof Error ? e.message : 'Falha ao acessar o Drive.' };
  }
}

const CT: Record<string, string> = { png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

// Baixa um lote de imagens do Drive e grava no Storage, setando Sku.imageUrl.
export async function syncDriveImagesBatch(
  items: { fileId: string; skuId: string; erpCode: string; ext: string }[],
): Promise<{ done: number; error?: string }> {
  await requireAdmin();
  let done = 0;
  try {
    for (const it of items) {
      const ext = CT[it.ext] ? it.ext : 'jpg';
      const bytes = await downloadFile(it.fileId);
      const url = await uploadImage(`sku/${it.erpCode}.${ext}`, bytes, CT[ext] ?? 'image/jpeg');
      await prisma.sku.update({ where: { id: it.skuId }, data: { imageUrl: url } });
      done++;
    }
    revalidatePath('/admin/produtos');
    return { done };
  } catch (e) {
    return { done, error: e instanceof Error ? e.message : 'Falha ao sincronizar.' };
  }
}
