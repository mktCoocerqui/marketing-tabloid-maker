# Análise do Excel real (`TABLOIDE_SUPER.xlsx`)

Análise do arquivo fornecido pela equipe (23 MB, **324 abas**, 22k strings, **0 imagens**).
Calibra o importador (fatia 7) e o modelo de ofertas.

## Estrutura geral

- **Cada aba = uma campanha/tabloide** (ex.: `FDS 23 A 2401`, `CHURRAS 2501`,
  `TERÇA QUARTA HORTI 20 A 21`, `REVISTA GERSON FEVEREIRO`). As abas "REVISTA <COMPRADOR>" são
  catálogos por comprador.
- **É um export comercial/de precificação**, não um feed limpo de ofertas. A maioria das ~26 colunas
  é ruído financeiro (custo, imposto, margem, sellin/sellout, lucro). Poucas interessam ao tabloide.
- **Sem imagens** e **sem coluna de imagem** → as imagens virão do **PIM por match de `COD`**.
- Há **linhas em branco / zeradas** no meio (devem ser ignoradas).
- Decimais aparecem com ponto no XML (numéricos). Unidade vem embutida na descrição (`5KG`, `1L`, `KG`, `500G`).

## Colunas (linha 1 = cabeçalho)

| Col | Cabeçalho | Uso no tabloide |
|-----|-----------|-----------------|
| A | COD | **`internalCode`** — chave p/ casar imagem/produto no PIM |
| B | DESCRICAO | **nome/título** da oferta |
| C–J | Custo Líquido/Verba, Imposto(s), Preço Líquido, Lucro, CUSTO | ruído (interno) |
| K | PREÇO REGULAR | ruído/instável (valores inconsistentes) — **não usar como "De"** |
| **L** | **PREÇO PADRAO** | **preço "De"** (`previousPrice`) |
| **M** | **PREÇO DIRIGIDA** | **preço "Por"** (`price`, preço da oferta) |
| N–Q | Margem, Sellout, Sellin, Margem Verba | ruído |
| R | COMPRADOR | metadado (útil p/ filtrar/organizar; não vai à arte) |
| S | ESPAÇO / Volume Médio | varia por aba; metadado |
| T–V | volumes/financeiro | ruído |
| **X** | (obs) | **dinâmica/espaço**: `PAGINA INTEIRA`, `junto <COD>` (combo), `limite N unidades` |
| **Y** | (posição) | **importância/posição**: `DESTAQUE`, `FRENTE`, `1° LINHA`, `2° LINHA` |
| Z | (extra) | às vezes repete COD ou o agrupamento "junto" |

> Observação: nem toda linha traz M (PREÇO DIRIGIDA). Regra do importador: se `M` vazio, a oferta
> fica **sem preço promocional** e é sinalizada na prévia para o usuário resolver (não inventar preço).

## Sinais que alimentam a autodiagramação

- **`Y` → prioridade/tamanho do frame**: `DESTAQUE`/`PAGINA INTEIRA` (X) = frame grande/realçado;
  `FRENTE` = capa/frente; `1° LINHA` > `2° LINHA` na hierarquia. Mapa proposto:
  `PAGINA INTEIRA`→priority 100 · `DESTAQUE`→80 · `FRENTE`→60 · `1° LINHA`→40 · `2° LINHA`→20 · vazio→10.
- **`X` "junto <COD>" → combos**: itens com mesmo preço agrupados (ex.: mesmo produto GRN/fresco).
  Podem virar uma dinâmica "combo/agrupado" ou ficar lado a lado. No MVP: importar como ofertas
  separadas + `metadata.groupWith = [cods]` para tratamento futuro.
- **`X` "limite N unidades" → selo** "limite N un." na arte (`metadata.limit`).

## Mapeamento padrão sugerido (perfil "TABLOIDE_SUPER")

O importador terá um **perfil salvável**. O default para este arquivo:

```
A  COD            → internalCode          (match no PIM p/ imagem/categoria)
B  DESCRICAO      → title
L  PREÇO PADRAO   → previousPrice (De)
M  PREÇO DIRIGIDA → price (Por)
X  (obs)          → parser de dinâmica: PAGINA INTEIRA | junto <cod> | limite N
Y  (posição)      → priority (via mapa acima)
R  COMPRADOR      → metadata.buyer
```

Dinâmica default: **`de-por`** quando há L e M; **`simple`** quando só há M (ou só L).

## Implicações confirmadas no produto

1. **Importador por mapeamento é essencial** (a planilha é suja e variável entre abas). Precisa de:
   auto-detecção de colunas por cabeçalho, seleção da(s) aba(s), descarte de colunas de ruído,
   skip de linhas vazias/zeradas, e **prévia** antes de gerar as ofertas.
2. **PIM é dependência do enriquecimento**: sem imagem no Excel, o valor visual vem do match por `COD`.
   Produtos novos (COD inexistente) são sinalizados p/ cadastro/foto.
3. **`Y`/`X` são ouro para a autodiagramação** — já entram como `priority` e dinâmica, não como texto solto.
4. O parser de preço deve tratar vazios e não confundir `PREÇO REGULAR` (K) com o "De" (L).

Fixture de exemplo (colunas relevantes, aba `FDS 23 A 2401`): `docs/fixtures/exemplo-ofertas-FDS.csv`.
