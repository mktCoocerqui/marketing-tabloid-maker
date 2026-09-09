# Marketing Tabloid Maker

Plataforma interna para **criação e diagramação inteligente de tabloides promocionais**:
importar ofertas de Excel → interpretar dados → escolher template → **autodiagramar** →
editar num editor visual (estilo Canva) → revisar → exportar **PNG/PDF de alta qualidade**.

> **Status:** Fase 1 — fundação concluída + **infra Supabase provisionada** (schema, RLS, seed e
> bucket de imagens no projeto `TABLOID-MAKER`). Build/lint limpos. Em andamento: fatia 2
> (auth Supabase e-mail/senha + PIM + `/admin`). Ver [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Documentação

- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — análise, stack, arquitetura, editor/canvas,
  exportação e autodiagramação.
- [`docs/MODELO-DE-DADOS.md`](docs/MODELO-DE-DADOS.md) — entidades e decisões do schema.
- [`docs/ANALISE-EXCEL.md`](docs/ANALISE-EXCEL.md) — análise do Excel real e mapeamento do importador.
- [`docs/ANALISE-VISUAL.md`](docs/ANALISE-VISUAL.md) — calibração pelas artes reais (frames, temas, dinâmicas).
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — MVP fatiado, plano incremental e status das decisões.
- [`prisma/schema.prisma`](prisma/schema.prisma) — modelo de dados.

## Como rodar (dev)

```bash
pnpm install
cp .env.example .env          # ajuste DATABASE_URL (PostgreSQL)
pnpm db:generate              # gera o Prisma Client
pnpm db:push                  # cria o schema no banco
pnpm db:seed                  # formatos de página + dinâmicas
pnpm dev                      # http://localhost:3000  (health: /api/health)
```

## Stack proposta (a confirmar)

Next.js 15 (App Router) · TypeScript · Tailwind + shadcn/ui · PostgreSQL + Prisma ·
Zustand/zundo · react-moveable + selecto · renderer DOM/SVG único · exportação via
Chromium headless (`@sparticuz/chromium` na Vercel) · SheetJS para Excel ·
**deploy na Vercel** (Postgres pooled + Vercel Blob) · painel `/admin`.

## Princípio central

Dados comerciais (produtos/ofertas) são **separados** da apresentação (frames/elementos).
Um _frame de oferta_ referencia a oferta por id e cuida só do visual; mover/redimensionar
nunca altera preço ou descrição, e editar a oferta reflete no layout.

## Próximo passo

Validar as **Decisões em aberto** do `ROADMAP.md` (em especial stack e o Excel real) e então
iniciar a **fatia 1 — fundação**.
