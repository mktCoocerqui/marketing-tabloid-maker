# Análise visual das artes reais (Coocerqui)

Calibração a partir de 3 encartes reais fornecidos (Açougue/Frios, Hortifrúti/Mercearia,
"Tudo por R$10"). Alimenta os `FrameStyle`, o tema dos templates e a autodiagramação (fatia 6).

> As imagens foram fornecidas apenas para referência (não versionadas). Este documento é a
> destilação do que elas definem.

## Formato e proporção
- **Retrato**, proporção ≈ **1 : 1,58** (mais alto que A4). Tratado como formato `encarte-digital`
  no seed (calibrado por ~1080×1707px; confirmar tamanho/impressão exatos com a equipe).
- Sangria/margens generosas; cantos arredondados fortes nos cards.

## Anatomia da página (de cima p/ baixo)
1. **Hero / cabeçalho** (~25% do topo):
   - Logo da campanha ("60 anos", "Coocerqui"), **título da campanha/categoria** (ex.: "Terça e
     Quarta do Açougue", "Hortifrúti", "Tudo por apenas R$10").
   - **Selo promocional** ("COMPROU VIROU PRESENTE — concorra a R$500").
   - **Barra de validade**: "Ofertas válidas em 01 e 02/09, enquanto durarem os estoques. Válidas
     em todas as lojas!" → mapeia `validFrom/validTo` + observação.
2. **Corpo**: pilha vertical de **faixas por categoria** (bands). Cada faixa:
   - **Rótulo lateral girado** (vertical) com cor do tema: `Açougue/Frios`, `IQF`, `Pescado`,
     `Bebidas`, `Hortifrúti`, `Padaria/Mercearia`, `Mercearia`.
   - **Card branco arredondado** com **4 ofertas por linha**.
   - ~6 faixas/página → **~24 ofertas/página** (4×6). Confirma capacidade p/ o cálculo de páginas.
3. **Rodapé legal** (texto vertical): "BEBA COM MODERAÇÃO", selo "somos coop".

## Anatomia do frame de oferta
```
┌───────────────────────────────┐
│ [selo "PRODUTO"]   Descrição   │
│  ┌─────────┐       do produto  │
│  │ IMAGEM  │                   │
│  └─────────┘   ┌─ bloco preço ┐│
│                │ (por dinâmica)││
│  [selo limite/exceto loja]     │
└───────────────────────────────┘
```
Slots do `FrameStyle`:
- **imagem** (com possível overlay do selo "COMPROU VIROU PRESENTE / PRODUTO");
- **descrição** (nome do produto, auto-fit);
- **bloco de preço** (renderizado pelo componente da **dinâmica**);
- **selos**: limite ("Limite 3Kg", "Limite 48Unid", "Limite 12Unid", "Limite 1Combo"),
  exceção de loja ("Exceto P. Ignácio", "Exceto Bordô"), etário ("18", "BEBA COM MODERAÇÃO").

## Dinâmicas observadas (e o que muda no modelo)
| Dinâmica | Como aparece | id no registry |
|---|---|---|
| De / Por | "DE: R$ 49,99" (riscado) + "POR: R$ 43,99" (grande) | `de-por` |
| **Preço Cooperado** | "R$ 19,99" + "Preço Cooperado: R$ 14,99" (ícone carrinho) | **`cooperado`** (novo) |
| Leve X por R$Y | "LEVE 5 POR R$10" + "Pague em cada Unid: R$2,00" | **`leve-x-por-y`** (novo) |
| Leve/promo unidade | "LEVE 2 POR R$10,00" + "Unidade na promoção: R$5,00" | `leve-x-por-y` |
| Simples | "R$ 5,99" único | `simple` |

> **Preço Cooperado é onipresente** (Coocerqui é cooperativa): a maioria das ofertas tem preço
> regular + preço de sócio. Modelado como dinâmica `cooperado` (dois níveis de preço).

## Tipografia do preço (regra de renderização)
- **Tag arredondada** vermelha (ou verde no tema festivo), texto branco.
- `R$` pequeno sobrescrito · **inteiro grande** · **centavos pequenos elevados** · vírgula.
- "DE:" pequeno com **tachado**; "POR:" em destaque.
- O componente de preço por dinâmica encapsula esse estilo (não é texto solto).

## Tema por campanha (Template.theme)
- **Vermelho** (açougue/frios), **verde** (hortifrúti/mercearia), **festivo verde+dourado** (R$10).
- Tema define: cor da faixa/rótulo, cor das tags de preço, cor de fundo e realces.

## Consequências no produto
1. **Novas dinâmicas**: `cooperado` e `leve-x-por-y` adicionadas ao seed/registry.
2. **Layout em faixas por categoria** vira a estrutura primária de template e a base natural da
   autodiagramação: **agrupar ofertas por categoria → preencher a faixa (4 por linha)**.
   `OfferFrame.groupLabel` marca a faixa; `Template.theme` guarda as cores.
3. **FrameStyle** precisa de slots de **selos** (limite/exceção/etário) além de imagem/descrição/preço.
4. **Capacidade ~24/página** (4×6) é o número de referência p/ o cálculo de páginas adicionais.
5. **Imagens** (sem foto no Excel) são o elemento visual central → PIM por `COD` é caminho crítico.
