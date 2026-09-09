# Roadmap & plano de implementação incremental

Princípio (seções 31–32): construir a **fundação** primeiro e **validar cada etapa** antes de
avançar. Nada de implementar tudo em paralelo.

## Fatiamento do MVP (Fase 1) em incrementos verificáveis

Cada fatia é entregável e testável isoladamente. Ordem proposta:

| # | Fatia | Entrega verificável |
|---|---|---|
| 1 | **Fundação**: Next.js + TS + Tailwind + Prisma + Postgres, auth básico, layout base | App sobe, migração cria o schema, login funciona |
| 2 | **PIM básico + storage** | Cadastrar/listar/editar produto com imagem; buscar/filtrar por categoria |
| 3 | **`document-model` + `renderer`** (shared) | Renderizar um documento JSON de exemplo (textos/imagens/formas) em tela e numa rota estática |
| 4 | **Exportação PNG/PDF** (Playwright/Chromium) | Exportar o documento da fatia 3 em PDF vetorial e PNG alta-DPI, dimensões reais |
| 5 | **Editor visual**: store (zustand/zundo), interação (moveable/selecto), painéis, grid, snap, atalhos, autosave | Mover/resize/rotate/multi-seleção/undo-redo/autosave em páginas |
| 6 | **Templates + FrameStyle + offer-frame** | Criar template com frames; renderer desenha o frame a partir de uma oferta |
| 7 | **Importação de Excel** (mapeamento coluna→campo + prévia) | Subir `.xlsx`, mapear colunas, revisar, gerar `TabloidOffer` |
| 8 | **Criação de tabloide** (nome/template/formato/orientação/páginas + import) | Fluxo "Novo tabloide" completo |
| 9 | **Autodiagramação v1** (determinística + scoring) | Botão "Autodiagramar" distribui ofertas nos frames; pergunta ao exceder capacidade |
| 10 | **Aba de Ofertas** (tabela editável, reflete no visual) | Editar preço/descrição/etc. e ver refletir no editor |
| 11 | **Navegação de páginas** (add/dup/excluir/reordenar/aplicar template) | Multi-páginas operacional |

Ao final da Fase 1, o critério de sucesso (seção 34) itens 1–11 e 14 estão cobertos.

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

## Decisões em aberto (dependem de você)

1. **Stack** — confirma **Next.js + Postgres + Prisma + renderer DOM/SVG + export Chromium**?
   (ver `ARQUITETURA.md §2`). Se houver restrição de infra (ex.: sem Postgres, ou hospedagem
   específica), me avise agora — muda pouco do desenho, mas melhor decidir antes da fatia 1.
2. **Excel real** — preciso do arquivo da equipe (seção 33). Sem ele, modelo o importador por
   mapeamento genérico, mas não consigo calibrar colunas/preços/dinâmicas reais.
3. **Referência visual do tabloide** — uma arte real (PDF/imagem de um tabloide de vocês) para
   calibrar proporções, densidade de ofertas/página e tipografia dos `FrameStyle`.
4. **Autenticação** — credenciais internas simples no MVP, ou já integrar SSO (Google/Microsoft)?
5. **Storage de imagens** — há um bucket S3/MinIO disponível, ou começo com disco local em dev?
6. **Escopo do MVP** — concorda com a ordem das 11 fatias, ou quer priorizar algo (ex.: importação
   antes do editor) para destravar valor mais cedo?

Assim que validar (principalmente 1 e 2), começo pela **fatia 1 (fundação)** e sigo incrementalmente,
validando cada uma antes de avançar.
