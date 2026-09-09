# Modelo de dados

Implementação em [`prisma/schema.prisma`](../prisma/schema.prisma). Este documento explica as
decisões; o schema é a fonte da verdade.

> **Atualização (hierarquia PIM):** o catálogo agora é `ProductBase → Sku → Offer` (ver
> [`PIM.md`](PIM.md)). `Product`/`ProductImage` foram substituídos. COD_ERP é a âncora do SKU.

## Mapa das entidades

```
User

ProductBase ─< Sku ─< Offer >─ OfferType(registry)
   (família)   (COD_ERP / apresentação)

PageFormat ─< Template ─< TemplatePage ─< OfferFrame >─ FrameStyle
                                       (elements: jsonb estático)

Tabloid ─< TabloidPage        (elements: jsonb = scene graph, inclui offer-frames)
        ─< TabloidOffer        (snapshot da oferta no tabloide; referencia skuId + sourceOfferId)
        ─< TabloidVersion      (snapshot imutável do documento)
        ─< Review ─< ReviewParticipant / ReviewAction
        ─< Export
        ─< LayoutRun           (coleta p/ aprendizado)
```

## Decisões e porquês

**1. Por que `TabloidOffer` além de `Offer`?**
O escopo (seções 5, 16, 17) exige que alterar um produto/oferta no catálogo **não** mude um
tabloide já feito, e que dá para editar o preço *dentro* do tabloide. `TabloidOffer` é o snapshot
editável da oferta no contexto daquele tabloide, com ponteiros de origem (`sourceOfferId`,
`sourceProductId`) só para rastreio (ex.: "onde este produto foi usado").

**2. Por que o scene graph fica em `jsonb` (`TabloidPage.elements`) e não em tabelas por elemento?**
Um documento visual tem elementos muito heterogêneos e é lido/gravado sempre inteiro pelo editor.
`jsonb` (validado por Zod na aplicação) dá flexibilidade e performance de leitura. Onde precisarmos
consultar por atributo (ex.: quais tabloides usam o `FrameStyle` X), espelhamos o mínimo
relacionalmente (`TabloidElement`, reservado p/ Fase 2).

**3. Separação dado × visual (seção 25).**
O elemento `offer-frame` no `elements` guarda apenas geometria + `tabloidOfferId` + `frameStyleId` +
overrides. Nenhum dado comercial é duplicado no visual.

**4. `OfferFrame` (template) ≠ `offer-frame` (elemento do tabloide).**
`OfferFrame` são as **posições vazias** de um template. Ao criar/autodiagramar um tabloide, elas
viram elementos `offer-frame` nas páginas, então preenchidos por `TabloidOffer`.

**5. Versionamento (seções 20–21).**
`TabloidVersion.snapshot` congela o documento; a `Review` aponta para a versão revisada. Se o
tabloide muda depois, a review vira `STALE` ("alterado após a última revisão").

**6. Extensibilidade das dinâmicas (seção 7).**
`OfferType` é um registry (ids como `de-por`, `x-por-y`, `leve-x-pague-y`). Os parâmetros ficam em
`dynamicData` (jsonb). Adicionar uma dinâmica = novo id + componente renderer, sem migração de dados.

**7. Coleta para aprendizado (seção 15).**
`LayoutRun` grava entrada, resultado da autodiagramação, pesos e o **diff** das alterações manuais.
É só coleta — o ML fica para a Fase 3.

## Unidades e coordenadas
- Geometria em **milímetros** (mm), origem no canto superior-esquerdo da página.
- `PageFormat` guarda dimensões reais (ex.: A4 = 210×297mm) → preserva qualidade na exportação.
- Renderização converte mm→px por um fator de escala; export usa dimensões reais via CSS `@page`.

## Pendências que dependem do Excel real
Os campos de `Offer`/`TabloidOffer` refletem o escopo (seção 6), mas o **Excel real ainda não foi
fornecido**. Ao recebê-lo, ajustaremos: nomes/ordem de colunas, formatos de preço (vírgula decimal,
"R$"), como a dinâmica aparece na planilha, e como a imagem é referenciada (URL, código, arquivo).
O importador é **guiado por mapeamento** justamente para absorver variações.
