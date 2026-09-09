import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Formatos de página com dimensões reais (mm) — preservam qualidade na exportação.
const formats = [
  { id: 'a4', label: 'A4', widthMm: 210, heightMm: 297, orientation: 'PORTRAIT' as const },
  { id: 'a5', label: 'A5', widthMm: 148, heightMm: 210, orientation: 'PORTRAIT' as const },
  // Digital 1080x1350 px @ 96dpi ≈ 285.75 x 357.19 mm (proporção preservada).
  { id: 'digital-1080x1350', label: 'Digital 1080×1350', widthMm: 285.75, heightMm: 357.19, orientation: 'PORTRAIT' as const },
];

// Dinâmicas comerciais (registry). Calibradas pela análise do Excel real (docs/ANALISE-EXCEL.md):
// a dominante é "de-por" (PREÇO PADRAO -> PREÇO DIRIGIDA).
const offerTypes = [
  { id: 'simple', label: 'Preço simples' },
  { id: 'de-por', label: 'De / Por' },
  { id: 'x-por-y', label: 'X por Y (ex.: 3 por R$ 10)' },
  { id: 'leve-x-pague-y', label: 'Leve X pague Y' },
  { id: 'por-unidade', label: 'Preço por unidade' },
  { id: 'acima-de', label: 'Acima de X unidades' },
  { id: 'combo', label: 'Combo / agrupado' },
];

async function main() {
  for (const f of formats) {
    await prisma.pageFormat.upsert({ where: { id: f.id }, update: f, create: f });
  }
  for (const t of offerTypes) {
    await prisma.offerType.upsert({ where: { id: t.id }, update: { label: t.label }, create: t });
  }
  console.log(`Seed ok: ${formats.length} formatos, ${offerTypes.length} dinâmicas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
