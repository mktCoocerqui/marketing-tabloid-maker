'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { requireProfile } from '@/server/auth';

const createSchema = z.object({
  name: z.string().trim().min(1, 'Informe um nome.').max(120),
  formatId: z.string().min(1, 'Escolha um formato.'),
  pages: z.coerce.number().int().min(1).max(50).default(1),
});

export type CreateTabloidState = { error?: string; id?: string };

export async function createTabloidAction(
  _prev: CreateTabloidState,
  formData: FormData,
): Promise<CreateTabloidState> {
  const profile = await requireProfile();

  const parsed = createSchema.safeParse({
    name: formData.get('name'),
    formatId: formData.get('formatId'),
    pages: formData.get('pages'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }
  const { name, formatId, pages } = parsed.data;

  const format = await prisma.pageFormat.findUnique({ where: { id: formatId } });
  if (!format) return { error: 'Formato inválido.' };

  const tabloid = await prisma.tabloid.create({
    data: {
      name,
      formatId,
      ownerId: profile.id,
      pages: {
        create: Array.from({ length: pages }, (_, i) => ({ sortOrder: i, elements: [] })),
      },
    },
  });

  revalidatePath('/');
  return { id: tabloid.id };
}

export async function deleteTabloidAction(id: string): Promise<void> {
  await requireProfile();
  await prisma.tabloid.delete({ where: { id } });
  revalidatePath('/');
}
