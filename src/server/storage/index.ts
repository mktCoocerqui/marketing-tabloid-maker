import { createSupabaseAdminClient } from '@/server/supabase/admin';

// Interface única de storage de imagens. Produção: Supabase Storage (bucket "images").
// Trocável por Vercel Blob/S3 sem afetar chamadas do PIM/uploads.
const BUCKET = 'images';

export async function uploadImage(path: string, file: ArrayBuffer, contentType: string): Promise<string> {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType, upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteImage(path: string): Promise<void> {
  const supabase = createSupabaseAdminClient();
  await supabase.storage.from(BUCKET).remove([path]);
}
