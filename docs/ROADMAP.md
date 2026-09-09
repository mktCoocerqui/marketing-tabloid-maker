# Roadmap & plano de implementação incremental

Princípio (seções 31–32): construir a **fundação** primeiro e **validar cada etapa** antes de
avançar. Nada de implementar tudo em paralelo.

## Fatiamento do MVP (Fase 1) em incrementos verificáveis

Cada fatia é entregável e testável isoladamente. Ordem proposta:

| # | Fatia | Entrega verificável |
|---|---|---|
| 1 | ✅ **Fundação**: Next.js + TS + Tailwind + Prisma + schema, layout base, health check, seed | App **compila, faz build e lint limpos**; dashboard placeholder; `/api/health`; seed de formatos/dinâmicas. *(Auth entra junto da fatia 2.)* |
| 2 | **PIM básico + storage + auth + `/admin`** | Login; painel admin (role ADMIN); cadastrar/listar/editar produto com imagem; buscar/filtrar por categoria |
| 3 | **`document-model` + `renderer`** (shared) | Renderizar um documento JSON de exemplo (textos/imagens/formas) em tela e numa rota estática |
| 4 | **Exportação PNG/PDF** (Playwright/Chromium) | Exportar o documento da fatia 3 em PDF vetorial e PNG alta-DPI, dimensões reais |
| 5 | **Editor visual**: store (zustand/zundo), interação (moveable/selecto), painéis, grid, snap, atalhos, autosave | Mover/resize/rotate/multi-seleção/undo-redo/autosave em páginas |
| 6 | **Templates + FrameStyle + offer-frame** | Criar template com frames; renderer desenha o frame a partir de uma oferta |
| 7 | **Importação de Excel** (mapeamento coluna→campo + prévia) | Subir `.xlsx`, mapear colunas, revisar, gerar `TabloidOffer` |
| 8 | **Criação de tabloide** (nome/template/formato/orientação/páginas + import) | Fluxo "Novo tabloide" completo |
| 9 | **Autodiagramação v1** (determinística + scoring) | Botão "Autodiagramar" distribui ofertas nos frames; pergunta ao exceder capacidade |
| 10 | **Aba de Ofertas** (tabela editável, reflete no visual) | Editar preço/descrição/etc. e ver refletir no editor |
| 11 | **Navegação de páginas** (add/dup/excluir/reordenar/aplicar template) | Multi-páginas operacional |
| 12 | **Deploy na Vercel** | App online (Postgres pooled + Blob); export validado em produção |

Ao final da Fase 1, o critério de sucesso (seção 34) itens 1–11 e 14 estão cobertos.

**Painel administrador** (`/admin`, role ADMIN): começa na fatia 2 (usuários/PIM) e cresce ao longo
das fatias (templates, dinâmicas, formatos, perfis de import, visão de campanhas). Ver `ARQUITETURA.md §11`.

**Deploy contínuo**: a partir da fatia 2 já publicamos previews na Vercel a cada fatia, para validar
online cedo. A exportação (fatia 4) é o ponto a validar com atenção na Vercel (`ARQUITETURA.md §10`).

### Fase 2
PIM completo · biblioteca avançada de templates · **revisão** (participantes, "Revisei", aprovação,
comentários) · usuários/perfis · **versionamento** com flag "alterado após revisão" · histórico ·
jobs assíncronos (BullMQ) para export/reprocessamento.

### Fase 3
Análise do histórico (`LayoutRun`) · aprendizado das alterações · melhoria da autodiagramação ·
recomendações · otimização automática de layout.

## Como cada etapa é validada
- Fatias 1–2: migração + smoke test manual + testes de serviço.
- Fatia 3–4: **golden files** de export (comparar PDF/PNG de um documento fixo).
- Fatia 5: testes de interação do store (undo/redo, autosave) + verificação manual.
- Fatia 9: testes do algoritmo com conjuntos sintéticos (N ofertas × capacidade).

---

## Decisões — status

1. ✅ **Stack** confirmada (Next.js + Postgres + Prisma + renderer DOM/SVG + export Chromium).
2. ✅ **Excel real** recebido e analisado → `docs/ANALISE-EXCEL.md` + fixture em `docs/fixtures/`.
3. ✅ Fatias validadas (ordem das 11 mantida).
4–6. Confirmados: **Supabase Auth** (e-mail/senha, sem 2FA), **Supabase Storage** (bucket `images`),
   ordem das fatias mantida. **Infra Supabase já provisionada** (schema + RLS + seed + bucket) —
   ver `docs/DEPLOY.md`.

7. ✅ **Referência visual** recebida (3 artes reais) → `docs/ANALISE-VISUAL.md`. Calibrou formato
   (~1:1.58), layout em faixas por categoria, ~24 ofertas/página, dinâmicas (`cooperado`,
   `leve-x-por-y`) e a tipografia das tags de preço.
8. ✅ **Hosting = Vercel** e **admin panel** incorporados à arquitetura (`ARQUITETURA.md §10–11`).
   Storage de imagens: **Vercel Blob** (prod) / disco local (dev).

### Ainda útil ter (não bloqueia)
- **Tamanho/px exato** do encarte e se haverá versão **impressa** (A4) além da digital — para fechar
  o formato de exportação. Uso ~1:1.58 por enquanto.
- **Paleta/tipografia oficiais** (cores exatas dos temas vermelho/verde/festivo, fontes) — uso
  aproximações até receber a marca.

## Próximo passo
Iniciar a **fatia 2 — PIM + storage + auth + `/admin`**, seguida da **fatia 3 (document-model + renderer)**,
publicando previews na Vercel a cada fatia.
