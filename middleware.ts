import { type NextRequest } from 'next/server';
import { updateSession } from '@/server/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

// Roda em tudo, exceto assets estáticos e imagens.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
