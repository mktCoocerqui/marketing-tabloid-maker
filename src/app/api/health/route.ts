import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

// Health check: confirma que o app sobe e (se DATABASE_URL estiver setado) o banco responde.
export async function GET() {
  let db: 'ok' | 'unconfigured' | 'error' = 'unconfigured';
  if (process.env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      db = 'ok';
    } catch {
      db = 'error';
    }
  }
  return NextResponse.json({ status: 'ok', db, ts: new Date().toISOString() });
}
