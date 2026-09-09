# Arquitetura — Plataforma de criação e diagramação inteligente de tabloides

> Documento de proposta (Fase 0). Objetivo: analisar o escopo, propor stack, arquitetura,
> modelo de dados, arquitetura do editor/canvas, pipeline de exportação e o algoritmo de
> autodiagramação — **antes** de escrever a maior parte do código, conforme seções 32 e 35 do escopo.
>
> **Status:** aguardando validação das decisões-chave (ver `docs/ROADMAP.md` → "Decisões em aberto").

---

## 1. Análise do problema

O sistema não é um CRUD com um canvas — é uma **ferramenta de produção gráfica** com três
subsistemas que precisam conviver sem se contaminar:

1. **Dados comerciais** (produtos, ofertas): estruturados, versionáveis, independentes do visual.
2. **Documento visual** (tabloide → páginas → elementos): um *scene graph* editável, com
   coordenadas reais para impressão.
3. **Inteligência de composição** (autodiagramação): algoritmo que casa ofertas com posições.

A decisão arquitetural central de todo o escopo (seções 3, 11, 17, 25) é:

> **Separar dados de apresentação.** Uma _oferta_ carrega os dados. Um _frame de oferta_ carrega
> a apresentação. Mover/redimensionar um frame nunca altera preço/descrição; editar o preço na
> aba de ofertas reflete no visual automaticamente.

Isso se traduz em um princípio técnico: o elemento visual do tipo `offer-frame` **referencia** uma
oferta por `offerId` e um estilo por `frameStyleId`; ele **não copia** os dados comerciais.

### Riscos técnicos principais (e como a arquitetura os endereça)

| Risco | Mitigação arquitetural |
|---|---|
| Editor "bonito" mas exportação em baixa qualidade (screenshot) | **Um único renderer** (React/DOM+SVG) usado tanto na edição quanto na exportação; export via Chromium headless → PDF vetorial. Sem divergência WYSIWYG. |
| Texto estourando o frame na diagramação automática | Frame com **auto-fit** (medição real de texto + faixa min/max de fonte) e o scoring penaliza overflow. |
| Lógica monolítica difícil de evoluir | Organização **modular por domínio** (`modules/*`) e um **registry de dinâmicas comerciais** para adicionar tipos sem reescrever (seção 7). |
| Revisão invalidada silenciosamente ao editar | **Versionamento** do documento (snapshots imutáveis) + flag "alterado após revisão" (seções 20–21). |
| Perda de trabalho no editor | Modelo de documento em store com **undo/redo** e **autosave** debounced + otimista (seções 28–29). |

---

## 2. Stack tecnológica (proposta) e justificativa

| Camada | Escolha | Por quê |
|---|---|---|
| App / full-stack | **Next.js 15 (App Router) + TypeScript** | Um único projeto para UI + API (route handlers/server actions). Time interno, deploy simples, ótimo DX. React é obrigatório dado o editor visual. |
| UI kit | **Tailwind CSS + shadcn/ui (Radix)** | Interface profissional e rápida de construir; componentes acessíveis; identidade própria (não copiar Pricefy). |
| Estado do editor | **Zustand + Immer + zundo** | Store leve e performática para o scene graph; `zundo` dá undo/redo por histórico de estados; Immer facilita patches imutáveis. |
| Interação no canvas | **react-moveable + selecto** | Drag/resize/rotate, **snapping**, guias e **seleção múltipla (marquee)** prontos e maduros — evita reimplementar transformadores. |
| Renderização visual | **DOM + SVG (React)** — renderer único | Texto vetorial nítido, escala infinita, casável 1:1 com a exportação. (Ver seção 5.) |
| Exportação PNG/PDF | **Chromium headless** via `@sparticuz/chromium` + `puppeteer-core` na Vercel | Imprime a mesma página React em dimensões reais → **PDF vetorial** e **PNG alta-DPI**. Nada de screenshot da UI. (Ver §10 sobre a restrição da Vercel e o plano de contingência.) |
| Banco | **PostgreSQL gerenciado (Neon/Supabase/Vercel Postgres) + Prisma** | Relacional + `jsonb` para o scene graph. Em serverless usa **conexão pooled** (PgBouncer) + `directUrl` p/ migrations. |
| Import Excel | **SheetJS (xlsx)** | Lê `.xlsx/.xls`, permite a etapa de **mapeamento coluna→campo** (seção 6). |
| Storage de imagens | **Vercel Blob** (prod) / disco local (dev) via interface única | Disco da Vercel é efêmero/somente-leitura → imagens de produto/oferta e uploads vão para Blob (ou S3). |
| Auth | **Auth.js (NextAuth)** | Time interno; começa com credenciais/e-mail, extensível a SSO. Roda bem na Vercel. |
| Hosting | **Vercel** | Deploy do Next.js. Ver §10 (deploy, limites e mitigações). |
| Fila / jobs | **(Fase 2)** worker externo p/ export pesado | Se a exportação estourar limites da Vercel, migra p/ um worker dedicado (Railway/Render/Fly). |

### Por que **não** Konva/Fabric puros para o documento

Canvas 2D (Konva/Fabric) é excelente para _interação_, mas o texto é **rasterizado**; a exportação
para impressão perde nitidez vetorial e o controle tipográfico fica pobre. Como o requisito 22 exige
**qualidade gráfica de impressão** e proíbe screenshot, adotamos **DOM+SVG como fonte visual da
verdade** e delegamos a interação (arrasto/resize/rotação/snap) ao `react-moveable`, que opera
sobre elementos DOM. Assim o **mesmo** componente que o usuário edita é o que vai para o PDF.

> Decisão registrada: **"single renderer, dois modos"** (edição vs. estático). É a decisão que
> mais protege o critério de sucesso #14 (exportar alta qualidade).

---

## 3. Arquitetura de alto nível

```
┌──────────────────────────── Next.js App ────────────────────────────┐
│                                                                      │
│  UI (React)                        Server (route handlers/actions)   │
│  ┌───────────────┐                 ┌──────────────────────────────┐  │
│  │ Dashboard     │                 │ modules/products             │  │
│  │ PIM           │                 │ modules/offers               │  │
│  │ Importador    │  ── fetch ──▶   │ modules/templates            │  │
│  │ Editor        │                 │ modules/tabloids             │  │
│  │  ├ Renderer   │                 │ modules/autolayout           │  │
│  │  ├ Interação  │                 │ modules/review               │  │
│  │  └ Painéis    │                 │ modules/export (Playwright)  │  │
│  │ Revisão       │                 │ modules/import (xlsx)        │  │
│  └───────────────┘                 └──────────────┬───────────────┘  │
│         │                                         │                  │
│         │ Zustand store (scene graph, undo/redo, autosave)          │
│         ▼                                         ▼                  │
│  ┌─────────────────────────────┐        ┌──────────────────────┐    │
│  │ shared/document-model (JSON) │◀──────▶│ Prisma → PostgreSQL  │    │
│  │ shared/renderer (React/SVG)  │        │ Storage (S3/MinIO)   │    │
│  └─────────────────────────────┘        └──────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

O pacote **`shared/document-model`** (tipos + validação Zod do scene graph) e
**`shared/renderer`** (componentes React que desenham o documento) são **isolados de UI e de
persistência** — reutilizados no editor, na tela de revisão e na exportação. Essa é a peça que
garante consistência visual em todos os contextos.

---

## 4. Modelo conceitual de dados

Detalhado em `docs/MODELO-DE-DADOS.md` e implementado em `prisma/schema.prisma`. Resumo das
entidades e do relacionamento crítico do escopo (seção 24):

```
Product ──< ProductImage
Product ──< Offer            (uma oferta origina-se de um produto, mas guarda seu snapshot)
OfferType (registry)

Template ──< TemplatePage ──< TemplateElement
                          └─< OfferFrame        (posições vazias no template)
FrameStyle                                       (estilo visual reutilizável do frame)

Tabloid ──< TabloidPage ──< TabloidElement       (element pode ser offer-frame)
Tabloid ──< TabloidOffer                          (a oferta "dentro" deste tabloide, versionável)
Tabloid ──< TabloidVersion (snapshots imutáveis)

Review ──< ReviewParticipant ──< ReviewAction
Export (registro dos arquivos gerados)
User
```

Cadeia de referência do escopo:

```
Product → Offer → TabloidOffer → (TabloidElement type=offer-frame) → renderiza usando FrameStyle
```

Pontos-chave:
- **`TabloidOffer`** é o dado da oferta *congelado no contexto do tabloide* (permite editar preço no
  tabloide sem mexer no catálogo, e preserva o material já finalizado — seções 5, 16, 17).
- **`TabloidElement (offer-frame)`** guarda só `x,y,w,h,rotation,z`, `tabloidOfferId` e `frameStyleId`
  + overrides visuais — nunca os dados comerciais (seção 25).
- O **scene graph** de cada página é `jsonb` (elementos), validado por Zod, com espelho relacional
  mínimo para consultas (ex.: quais tabloides usam o produto X).

---

## 5. Arquitetura do editor / canvas

### 5.1 Documento como fonte da verdade

O documento é um JSON tipado (unidades em **mm**, origem no canto sup. esq. da página):

```jsonc
{
  "id": "tab_123",
  "page": { "widthMm": 210, "heightMm": 297, "bleedMm": 3, "safeMm": 5, "grid": {...} },
  "elements": [
    { "id":"el_1","type":"text","x":10,"y":8,"w":190,"h":20,"rotation":0,"z":5, "props": {...} },
    { "id":"el_2","type":"image","x":10,"y":30,"w":90,"h":60,"rotation":0,"z":4, "props": {...} },
    { "id":"el_3","type":"offer-frame","x":10,"y":100,"w":48,"h":64,"rotation":0,"z":6,
      "tabloidOfferId":"toffer_9","frameStyleId":"fs_grid_v1","overrides": {} }
  ]
}
```

### 5.2 Renderer único (edição = exportação)

`shared/renderer` transforma esse JSON em React. Cada `type` tem um componente:
`TextEl`, `ImageEl`, `ShapeEl`, `OfferFrameEl`, … Posição via `transform: translate/rotate` e
`mm → px` por um fator de escala (`scale`). O **mesmo** componente é usado:
- no **editor** (com camada de interação por cima),
- na **tela de revisão** (somente leitura, com zoom),
- na **exportação** (renderizado em página estática e impresso pelo Chromium).

### 5.3 Camada de interação

Sobre o render, o editor monta:
- **react-moveable**: drag, resize (com `Shift` mantém proporção), rotação, **snap** a grid/bordas/
  centro/outros elementos, **guias de espaçamento igual**.
- **selecto**: seleção múltipla por marquee; agrupar/alinhar/distribuir.
- **Atalhos** (seção 27): `Ctrl+Z/Shift+Z`, `Ctrl+C/V/D`, `Delete`, setas (nudge), zoom, pan,
  copiar propriedades. Camada única de keymap → dispara ações no store.

### 5.4 Estado, histórico e autosave

- **Zustand + Immer**: store do documento; ações mutam via patches imutáveis.
- **zundo**: pilha de undo/redo (agrupando operações contínuas de arrasto em um passo).
- **Autosave**: efeito que observa mudanças "commitáveis", faz *debounce* (~800ms), persiste o
  documento e exibe `Salvando… / Salvo`. Persistência otimista; conflito resolvido por `updatedAt`.

### 5.5 Frames de oferta (seção 11) — como implementamos

Um **FrameStyle** é um mini-template paramétrico que mapeia campos da oferta → subelementos
posicionados dentro da caixa do frame:

```
FrameStyle "grid_v1"
├── slot imagem      (box relativo, object-fit)
├── slot descrição   (fonte, min/max, alinhamento, auto-fit)
├── slot preço       (renderizado pelo componente da DINÂMICA da oferta)
└── slot selos/validade (opcional)
```

O componente `OfferFrameEl(offer, frameStyle, box, overrides)`:
1. Lê os dados da `TabloidOffer`.
2. Escolhe o **renderer da dinâmica** no *registry* (`simple`, `x-por-y`, `leve-x-pague-y`,
   `de-por`, `por-unidade`, `acima-de`…). Adicionar um novo tipo = registrar um componente novo,
   sem tocar no resto (seção 7).
3. Faz **auto-fit** do texto: mede e ajusta a fonte dentro de `[min,max]` para não estourar.
4. Aplica `overrides` visuais específicos do elemento (ex.: destacar preço).

Resultado: dados e visual separados; editar a oferta atualiza o frame; mover o frame não toca nos dados.

---

## 6. Pipeline de exportação PNG/PDF (seção 22)

```
Documento (JSON)
   │
   ├── shared/renderer  →  Página estática HTML/SVG  (dimensões reais via @page/CSS mm)
   │                        + fontes embarcadas (public/fonts)
   ▼
Playwright (Chromium headless, já instalado)
   ├── page.pdf({ printBackground, preferCSSPageSize })  → PDF vetorial p/ gráfica
   └── page.screenshot({ deviceScaleFactor: N })         → PNG alta resolução
```

- **PDF vetorial**: texto e formas permanecem vetores; imagens em resolução original; sangria/bleed
  e área segura respeitadas por CSS `@page`.
- **PNG**: `deviceScaleFactor` alto (ex.: 3–4×) para impressão/《social 1080×1350》.
- É o **mesmo** componente do editor → WYSIWYG garantido. Sem "screenshot da interface".
- Rota dedicada `/(export)/tabloid/[id]/page/[n]` que só monta o renderer estático; o serviço de
  export navega até ela e imprime.

---

## 7. Autodiagramação v1 (seções 13–15) — determinística + scoring

Primeira versão **sem ML**, explicável e testável. Entradas: lista de `TabloidOffer` e um template
com páginas/frames. Saída: atribuição oferta→frame por página + relatório.

### Passos

1. **Featurização de cada oferta**: `priority` (metadado/destaque), `textLen` (nome+descrição),
   `hasImage`, `type` (dinâmica), `category`.
2. **Capacidade**: soma dos frames de todas as páginas. Se `N_ofertas > capacidade` → **não corta**;
   pergunta ao usuário se deseja adicionar página(s) (seção 13).
3. **Atribuição gulosa + melhoria local**:
   - Ordena frames por área (desc) e ofertas por prioridade (desc); atribui em pares.
   - Calcula `score(offer, frame)` e roda **swaps locais** para maximizar o total.
   ```
   score = w1·fitTamanho      (cabe o conteúdo? penaliza overflow e vazio excessivo)
         + w2·casaPrioridade  (oferta destaque → frame maior/realçado)
         + w3·fitImagem       (tem imagem ↔ frame comporta imagem)
         + w4·fitTipo         (dinâmica combina com o layout do frame)
         + w5·equilíbrio      (distribui categorias; evita cluster; balanceia páginas)
   ```
4. **Fit-check tipográfico**: estima se o texto cabe na menor fonte legível; se estourar, tenta
   reduzir fonte (dentro do limite) ou marca "precisa de frame maior" e tenta um swap.
5. **Passo de equilíbrio**: espalha categorias, evita páginas visualmente pesadas/vazias.
6. **Auto-fit interno**: para cada colocação, resolve tamanho de imagem/fonte/ênfase do preço.

### Evita (seção 14)
texto estourando · imagens desproporcionais · preço minúsculo · vazio excessivo · concentração de
ofertas parecidas · páginas desequilibradas.

### Preparação para aprendizado (seção 15)
Ao finalizar um tabloide, gravamos um **registro de diagramação**: template, ofertas, posições,
tamanhos de frame, e o **diff** das alterações manuais do usuário (o que moveu/redimensionou/trocou).
Não há ML no MVP — só a **coleta** que alimentará, na Fase 3, o ajuste de pesos/recomendação.

---

## 8. Estrutura de pastas (proposta)

```
marketing-tabloid-maker/
├── docs/                        # esta proposta e decisões
├── prisma/
│   └── schema.prisma            # modelo de dados
├── public/fonts/                # fontes embarcadas p/ export fiel
├── src/
│   ├── app/                     # rotas Next (App Router)
│   │   ├── (dashboard)/         # dashboard, listagens
│   │   ├── pim/                 # gestão de produtos
│   │   ├── tabloids/[id]/       # editor
│   │   ├── review/[id]/         # tela de revisão
│   │   └── (export)/            # rotas estáticas p/ Chromium imprimir
│   ├── modules/                 # LÓGICA DE DOMÍNIO (uma pasta por bounded context)
│   │   ├── products/  offers/  templates/  tabloids/
│   │   ├── import/    autolayout/  export/  review/  learning/
│   ├── shared/
│   │   ├── document-model/      # tipos + Zod do scene graph
│   │   ├── renderer/            # componentes React que DESENHAM o documento
│   │   └── dynamics/            # registry de dinâmicas comerciais (offer types)
│   ├── components/              # UI genérica (shadcn/ui)
│   ├── editor/                  # store (zustand/zundo), interação, painéis, atalhos
│   ├── server/                  # db client, auth, storage, services
│   └── lib/                     # utils
└── (configs: package.json, tsconfig, next.config, tailwind, .env.example)
```

Cada `module` expõe serviços/casos-de-uso; a UI e as rotas **orquestram**, não concentram regra
(seção 23).

---

## 9. Decisões arquiteturais registradas (ADRs resumidos)

1. **Next.js full-stack** em vez de front + backend separado → menos superfície para um time interno; extraível depois.
2. **DOM+SVG renderer único** em vez de Konva/Fabric → qualidade vetorial + WYSIWYG na exportação.
3. **Interação via react-moveable/selecto** em vez de transformador próprio → snapping/guias maduros no MVP.
4. **Export via Chromium (Playwright) já instalado** → PDF vetorial e PNG alta-DPI sem screenshot.
5. **Separação dado×visual** com `TabloidOffer` (snapshot) e `offer-frame` referenciando por id → cumpre seções 17/25.
6. **Autolayout determinístico + coleta de dados** → entrega valor já e prepara Fase 3 sem ML prematuro.
7. **PostgreSQL + jsonb para scene graph** → relacional onde importa, flexível onde o layout evolui.

Ver `docs/ROADMAP.md` para o MVP, o plano incremental e as **decisões que dependem de você**.

---

## 10. Deploy na Vercel (restrições e mitigações)

O app é online e hospedado na **Vercel**. Isso impõe decisões específicas:

### Banco (serverless-safe)
- Usar **Postgres gerenciado** com **connection pooling** (Neon, Supabase ou Vercel Postgres).
- `DATABASE_URL` = conexão **pooled** (PgBouncer, modo transaction); `DIRECT_URL` = conexão direta
  para `prisma migrate`. Já refletido no `schema.prisma`.
- `prisma generate` roda no build (`build: prisma generate && next build`).

### Storage de imagens (disco efêmero)
- O filesystem da Vercel é efêmero/somente-leitura em runtime → **não** salvar imagens em disco.
- Produção: **Vercel Blob** (ou S3). Dev: disco local. Abstraídos por uma interface `storage` única,
  então o código de PIM/uploads não muda entre ambientes.

### Exportação PNG/PDF — o ponto sensível
Playwright completo **não** roda bem em funções serverless da Vercel (tamanho/tempo). Plano:
- **MVP**: função serverless **Node** usando **`@sparticuz/chromium` + `puppeteer-core`** (Chromium
  enxuto compatível com a Vercel), navegando até a rota estática `/(export)/...` e gerando PDF/PNG.
  Rodar como **Route Handler Node.js** com `maxDuration` elevado; caber no limite de tamanho da função.
- **Contingência** (se estourar limite/timeout, ex.: tabloides grandes): mover a exportação para um
  **worker externo** (container com Playwright em Railway/Render/Fly), acionado por fila/HTTP. O
  **módulo `export` já é isolado atrás de uma interface**, então essa troca não afeta o resto.
- O princípio "**um renderer só**" se mantém: a rota estática renderizada é a mesma do editor.

### Configuração
- `vercel.json`/config define runtime Node e `maxDuration` da rota de export.
- Variáveis: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `BLOB_READ_WRITE_TOKEN` (Vercel Blob).

---

## 11. Painel administrador

O produto é usado por uma equipe interna e **precisa de um painel administrador** (área `/admin`,
restrita a `role = ADMIN`). Escopo:

- **Usuários & acessos**: convidar, definir papel (ADMIN / EDITOR / REVIEWER).
- **Templates & FrameStyles**: criar/editar/ativar, definir tema por campanha.
- **Formatos de página** e **dinâmicas comerciais** (registry): habilitar/rotular.
- **Perfis de importação** (mapeamentos salvos do Excel, ex.: perfil "TABLOIDE_SUPER").
- **Catálogo/PIM**: gestão de produtos e imagens (compartilha telas com o PIM).
- **Campanhas/tabloides**: visão geral de status (rascunho/revisão/aprovado), como no quadro da
  referência Pricefy (Definição → Diagramação → Produção → Execução).
- **Auditoria**: histórico de ações (`ReviewAction`, `LayoutRun`).

Implementado como um segmento de layout próprio com guarda de sessão/role. Entra a partir da fatia 2
(usuários + PIM) e cresce junto com templates/importação.
