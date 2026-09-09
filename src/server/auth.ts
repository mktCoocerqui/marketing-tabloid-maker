import 'server-only';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from './supabase/server';
import { prisma } from './db';
import type { User } from '@prisma/client';

// Usuário autenticado no Supabase (ou null).
export async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

// Perfil da app (public.User). Faz auto-provisionamento na primeira vez.
// O primeiro usuário do sistema vira ADMIN (bootstrap).
export async function getCurrentProfile(): Promise<User | null> {
  const user = await getAuthUser();
  if (!user) return null;

  const existing = await prisma.user.findUnique({ where: { id: user.id } });
  if (existing) return existing;

  const count = await prisma.user.count();
  return prisma.user.create({
    data: {
      id: user.id,
      email: user.email ?? '',
      name: (user.user_metadata?.name as string | undefined) ?? null,
      role: count === 0 ? 'ADMIN' : 'EDITOR',
    },
  });
}

// Exige sessão; redireciona para /login se não houver.
export async function requireProfile(): Promise<User> {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  return profile;
}

// Exige ADMIN; redireciona se não for.
export async function requireAdmin(): Promise<User> {
  const profile = await requireProfile();
  if (profile.role !== 'ADMIN') redirect('/');
  return profile;
}
