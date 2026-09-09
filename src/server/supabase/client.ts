'use client';

import { createBrowserClient } from '@supabase/ssr';

// Cliente Supabase para o browser (Auth via cookies). Usa a PUBLISHABLE key.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
