'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/server/supabase/server';
import { createSupabaseAdminClient } from '@/server/supabase/admin';
import { getCurrentProfile } from '@/server/auth';
import { prisma } from '@/server/db';

export type ActionState = { error?: string; ok?: boolean };

// Cadastro. Bootstrap: se não há usuários, o primeiro pode se cadastrar e vira ADMIN.
// Depois disso, apenas um ADMIN autenticado pode criar novos usuários (convite).
export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const name = String(formData.get('name') ?? '').trim();

  if (!email || password.length < 6) {
    return { error: 'Informe um e-mail válido e uma senha de ao menos 6 caracteres.' };
  }

  const userCount = await prisma.user.count();
  if (userCount > 0) {
    const profile = await getCurrentProfile();
    if (!profile || profile.role !== 'ADMIN') {
      return { error: 'Cadastro fechado. Peça a um administrador para criar seu acesso.' };
    }
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // sem fluxo de e-mail (ferramenta interna)
    user_metadata: { name },
  });
  if (error || !data.user) return { error: error?.message ?? 'Falha ao criar usuário.' };

  await prisma.user.upsert({
    where: { id: data.user.id },
    update: { email, name: name || null },
    create: { id: data.user.id, email, name: name || null, role: userCount === 0 ? 'ADMIN' : 'EDITOR' },
  });

  return { ok: true };
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
