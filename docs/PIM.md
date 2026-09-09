# PIM — Produto base, SKU, Oferta (hierarquia comercial)

Decisão fundamental de arquitetura: **não** tratar cada linha do Excel como um "produto".
O mesmo produto aparece em várias apresentações, campanhas e dinâmicas. Modelamos a hierarquia:

```
Categoria
  └── Produto base (família)      ex.: "Carne Bovina Acém"
        └── SKU / Apresentação    ex.: "Acém KG", "Acém Bandeja", "Acém Fatiado"  (COD_ERP)
              └── Oferta          preço + dinâmica + validade (várias ao longo do tempo)
                    └── TabloidOffer  snapshot da oferta dentro de um tabloide
                          └── frame     representação visual
```

Implementado em `prisma/schema.prisma`: `ProductBase → Sku → Offer → TabloidOffer`.

## Entidades

**ProductBase** (UI: "Produto") — conceito comercial. Sem preço. Campos: nome, categoria,
subcategoria, descrição, marca, status, imagem base.

**Sku** (UI: "Apresentação") — a variação vendável. Campos: `erpCode` (**COD_ERP**, único),
barcode, nome comercial, descrição, unidade, peso, imagem, imagem alternativa, preço regular,
status, **`erpData`** (JSON com dados do ERP), metadata.

**Offer** — um SKU + condição comercial num período. Campos: `skuId`, tipo (dinâmica), preço,
preço anterior (De), preço regular, unidade, `dynamicData`, validade, campanha, prioridade,
override de título/imagem. Um mesmo SKU tem **várias ofertas** ao longo do tempo.

**TabloidOffer** — a oferta congelada dentro de um tabloide (referencia `skuId` + `sourceOfferId`,
não copia o produto). Editar aqui não altera o catálogo.

## COD_ERP é a âncora
Identificador **externo estável**. A descrição pode mudar; o COD_ERP não. Prioridade de matching:
```
1. COD_ERP   2. código de barras   3. seleção manual   4. descrição (só como sugestão)
```
O sistema **nunca** associa silenciosamente quando há ambiguidade — apresenta candidatos p/ o usuário escolher.

## Dados do ERP guardados à parte (não confundir com produto base)
O Excel traz `PARAMETRO FAMILIA`, `COD_FAMILIA`, `CURVA`, `NOME_COMPRADOR` etc. Esses são dados do
ERP e ficam em `Sku.erpData` — **não** assumimos que `COD_FAMILIA` == nosso Produto base. O produto
base é um agrupamento da aplicação, que o usuário controla (o COD_FAMILIA pode servir de *sugestão*).

## Herança de imagem
```
imagem da Oferta  →  se ausente, imagem do SKU  →  se ausente, imagem do Produto base
```

## O Excel (dois papéis)
- **Aba `BASE`** = catálogo mestre de SKUs. Colunas: `COD_ERP, DESCRICAO, CURVA, NOME_COMPRADOR,
  CUSTO, PRECO, VOLUME MEDIO, PARAMETRO FAMILIA, COD_FAMILIA, Custo Contabil NF, ALIQUOTA SAIDA TOTAL`.
  → alimenta **SKUs** (erpCode=COD_ERP, name=DESCRICAO, regularPrice=PRECO, erpData={curva,
  comprador, codFamilia, parametroFamilia, custo, volumeMedio}).
- **Abas de campanha** (as centenas de abas) = **ofertas** de cada período. → casadas ao SKU por
  COD_ERP; preço De=`PREÇO PADRAO`, Por=`PREÇO DIRIGIDA`; `Y`=prioridade; `X`=dinâmica/limite.

## Fluxo de importação
```
Excel → identifica COD_ERP → acha SKU (por erpCode) →
  existe?  sim → cria a Oferta associada ao SKU (não duplica produto)
           não → cria SKU (e permite associar/criar Produto base) → cria Oferta
```
Ambiguidade (sem COD_ERP, só descrição) → **tela de correspondência**:
> "Encontramos possíveis correspondências para 'CARNE BOV.ACEM KG GRN': [Acém KG] [Acém Bandeja] …"

## UX (linguagem simples)
Na interface: **"Produto"** e **"Apresentação"** — nunca "SKU/ProductVariant". Os termos técnicos
existem só no banco/API.

- Árvore hierárquica: Categoria → Produto → Apresentações.
- Ao abrir uma apresentação: imagem, COD_ERP, barcode, unidade, descrição, **ofertas recentes**,
  **histórico** e **tabloides onde foi usada**.
- Ao criar/editar oferta: buscar produto → escolher apresentação (carrega imagem/unidade/COD_ERP) →
  preencher preço/dinâmica/validade.

## Sequência de implementação (próximas fatias)
1. **Modelo** (ProductBase/Sku/Offer/COD_ERP) — ✅ feito (migration `pim_product_sku_hierarchy`).
2. PIM UI: árvore Produto→Apresentação, ficha do SKU, edição.
3. Importação da aba `BASE` → SKUs (com criação/associação de Produto base).
4. Importação de aba de campanha → Ofertas (matching por COD_ERP) + **tela de ambiguidade**.
5. Seletor de produto/apresentação na criação de oferta.
6. Imagens (upload por nível + herança).
