# Schema do banco de referência 5e

Este documento descreve o schema interno usado pelo app para dados de referência
da 5e (classes, magias, raças, itens etc.). A fonte da verdade executável é
[`db/schema.sql`](../db/schema.sql) — este arquivo é a explicação narrativa das
decisões por trás dela.

O objetivo do schema é ser **independente da fonte dos dados**. Ele não assume
o formato do 5etools (nem de nenhuma outra fonte) — qualquer ferramenta que
produza um `.db` seguindo este schema funciona com o app, seja ela o importador
deste repositório (`scripts/import-5e-data.ts`, que lê o formato 5etools) ou uma
ferramenta própria que alguém escreva a partir do SRD oficial ou de outra fonte
que tenha o direito de usar.

## Por que SQLite

O banco compilado é embutido no app via `expo-sqlite` (`SQLiteProvider` com
`assetSource`), suportado nativamente pelo Expo SDK 54. Isso dá consultas
indexadas (ex: "magias do Mago até nível 3") e busca por texto (FTS5) sem
precisar carregar e fazer parse de JSON inteiro em runtime no celular.

## Convenções gerais

- Toda entidade principal tem `source` (código do livro, ex: `"PHB"`) e `srd`
  (0/1) preservados do dado original. Isso permite filtrar por "somente
  conteúdo SRD" via `WHERE srd = 1` em vez de precisar de dois bancos
  diferentes — útil se um dia quiserem gerar uma versão seura para publicar.
- `basic_rules` (0/1) marca o que também está nas Regras Básicas gratuitas da
  Wizards — um subconjunto ligeiramente maior que o SRD 5.1 puro, útil como
  segunda opção de filtro.
- Campos de texto rico e estruturas variáveis (`entries`, `prerequisite`,
  `startingEquipment`, bônus de atributo, etc.) ficam como colunas **JSON**
  (`TEXT` com JSON serializado), não totalmente normalizados em tabelas
  relacionais. SQLite tem suporte nativo a JSON (`json_extract`, etc.), e essas
  estruturas variam bastante de forma entre categorias — normalizar tudo
  custaria muito esforço de modelagem para pouco ganho prático. Reservamos
  tabelas relacionais de verdade (com chave estrangeira) para os relacionamentos
  que realmente importam para consulta: `class_features`/`subclass_features`
  (por classe/subclasse), `racial_traits` (por raça), `spell_classes` (quais
  classes podem aprender qual magia).
- Itens e magias têm uma coluna `details` JSON adicional, um catch-all para
  campos que existem em algumas entradas mas não valem a pena virar coluna
  própria (CA de armadura, alcance de arma à distância, tipo de munição,
  tags de dano/salvamento de magia etc.) — evita perder informação sem
  precisar modelar cada variação de item/magia do 5e.
- O importador (`scripts/import-5e-data.ts`) remove/converte a DSL de tags
  inline do 5etools (`{@damage 1d6}`, `{@item battleaxe|phb}`,
  `{@condition prone}` etc.) para uma forma simples e renderizável, extraindo
  o que for mecânico (dados de dano, tipo de save) para colunas estruturadas
  quando fizer sentido.

## Tabelas

| Tabela                                         | O que guarda                                                                                                                                   |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `sources`                                      | Código → nome do livro (ex: `PHB` → "Player's Handbook")                                                                                       |
| `classes`, `class_features`                    | Classes e as features de nível base (não de subclasse)                                                                                         |
| `subclasses`, `subclass_features`              | Subclasses e suas features                                                                                                                     |
| `races`, `racial_traits`                       | Raças (com `parent_race_id` para sub-raças, ex: Anão da Colina → Anão) e seus traços                                                           |
| `backgrounds`                                  | Antecedentes                                                                                                                                   |
| `feats`                                        | Talentos                                                                                                                                       |
| `optional_features`                            | Invocações Místicas, Estilos de Luta, e outras "opcionais" que não são talento nem feature fixa de classe                                      |
| `base_items`, `items`, `magic_variants`        | Itens mundanos, itens (incluindo mágicos) e variantes mágicas aplicáveis a itens base                                                          |
| `item_properties`                              | Nome e descrição de regra das propriedades de arma referenciadas por código em `base_items.properties`/`items.properties` (ex: `F` → Acuidade) |
| `spells`, `spell_classes`                      | Magias e a relação many-to-many com quais classes podem aprendê-las                                                                            |
| `languages`, `conditions`, `skills`, `actions` | Glossário de regras — categorias quase inteiramente cobertas pelo SRD                                                                          |
| `vehicles`, `deities`                          | Baixa prioridade, incluídas por completude                                                                                                     |
| `translations`                                 | Preparação para localização (ver abaixo)                                                                                                       |
| `content_fts`                                  | Tabela virtual FTS5 para busca por nome/texto entre categorias (`entity_type` diferencia a origem)                                             |

## Localização (pt-BR)

A tabela `translations` é populada por um segundo pipeline, separado do
import principal:

```
translations(entity_type, entity_id, locale, field, value)
```

Ex: `('spell', 42, 'pt-BR', 'name', 'Rajada Ácida')`.

- `translations/pt-BR/<CODIGO_DO_LIVRO>/<categoria>.json` guarda o texto
  extraído dos livros oficiais traduzidos (ex: `translations/pt-BR/PHB/spells.json`),
  indexado por **chave natural** (`"Nome em Inglês|FONTE"`, ou uma cadeia mais
  longa para entidades filhas como features de classe — ver comentários em
  `scripts/import-translations.mjs`) em vez do `id` numérico da linha. Isso é
  proposital: o `id` é reatribuído a cada `npm run db:import`, então indexar
  por chave natural é o que permite reaplicar a tradução depois de um
  re-import sem perder nada.
- `scripts/import-translations.mjs` (rodado via `npm run db:translate`, depois
  de `npm run db:import`) lê esses arquivos, resolve o `id` atual de cada
  entidade e povoa `translations`. Se `translations/pt-BR/` não existir (clone
  sem os livros processados), o script não faz nada.
- Termos sem tradução oficial clara (ambíguos, ou nome que colidiria com
  outro) ficam registrados em `translations/pt-BR/DUVIDAS.md` em vez de virar
  uma linha adivinhada.

`books/` (os PDFs) e `translations/` (o texto extraído deles) estão no
`.gitignore` e nunca são commitados.

## Distribuição de dados vs. código

- `db/schema.sql` e este documento são versionados normalmente — são apenas
  estrutura, sem conteúdo de nenhum livro.
- O dump bruto (`5e-2014-data/`) e o `.db` compilado (`assets/data/*.db`) estão
  no `.gitignore` — nunca são commitados. O `.db` que vai dentro do app é
  gerado localmente a cada build via `npm run db:import`.
- `db/overrides/*.json` (ex: `base-item-weights.json`) **é** versionado — são
  correções pontuais de fatos (peso, valor etc.) verificados contra os livros
  impressos. Aplicado automaticamente por `npm run db:import`.
- `books/` (PDFs) e `translations/` (texto extraído deles) — ver seção
  "Localização" acima — também estão no `.gitignore`.
