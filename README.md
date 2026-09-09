# Marketing Tabloid Maker

Plataforma interna para **criação e diagramação inteligente de tabloides promocionais**:
importar ofertas de Excel → interpretar dados → escolher template → **autodiagramar** →
editar num editor visual (estilo Canva) → revisar → exportar **PNG/PDF de alta qualidade**.

> **Status:** Fase 0 — proposta de arquitetura para validação. Ainda **não há** código de aplicação;
> esta entrega é a fundação documental + o modelo de dados. Ver as pendências antes de iniciar a Fase 1.

## Documentação

- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — análise, stack, arquitetura, editor/canvas,
  exportação e autodiagramação.
- [`docs/MODELO-DE-DADOS.md`](docs/MODELO-DE-DADOS.md) — entidades e decisões do schema.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — MVP fatiado, plano incremental e **decisões em aberto**.
- [`prisma/schema.prisma`](prisma/schema.prisma) — modelo de dados proposto.

## Stack proposta (a confirmar)

Next.js 15 (App Router) · TypeScript · Tailwind + shadcn/ui · PostgreSQL + Prisma ·
Zustand/zundo · react-moveable + selecto · renderer DOM/SVG único · exportação via
Playwright (Chromium headless) · SheetJS para Excel.

## Princípio central

Dados comerciais (produtos/ofertas) são **separados** da apresentação (frames/elementos).
Um _frame de oferta_ referencia a oferta por id e cuida só do visual; mover/redimensionar
nunca altera preço ou descrição, e editar a oferta reflete no layout.

## Próximo passo

Validar as **Decisões em aberto** do `ROADMAP.md` (em especial stack e o Excel real) e então
iniciar a **fatia 1 — fundação**.
