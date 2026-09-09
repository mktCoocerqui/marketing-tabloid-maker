import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Cliente com a SECRET key (service role) — SOMENTE no servidor. Ignora RLS.
// Usado para operações administrativas (ex.: criar usuário, gerenciar storage).
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
