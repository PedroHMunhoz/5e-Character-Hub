# TODO — Log de decisões do projeto

**Pendências abertas (o que falta fazer) agora vivem só no Trello —
board "5e Character Hub", lista "A fazer".** Este arquivo deixou de ser
lista de tarefas; guarda apenas o histórico de decisões de
simplificação/adiamento já tomadas, marcadas com `~~riscado~~` + nota,
para consulta futura em vez de depender de memória de conversa (o
porquê de uma decisão passada continua valendo mesmo depois que a
pendência em si vira card). Substitui o antigo `docs/wizard-todo.md`
(conteúdo migrado abaixo, sem perdas).

## Tradução PHB (pt-BR)

Fonte detalhada (log completo de dúvidas já resolvidas, page-map de
extração etc.): `translations/pt-BR/DUVIDAS.md` e
`translations/pt-BR/_page-maps/PHB.json` (gitignored, não versionados —
continuam sendo o fluxo de trabalho ativo da tradução; esta seção é só um
resumo do que falta).

Status geral: praticamente tudo do PHB já foi traduzido e importado —
magias (361), itens base, itens gerais (tabela EQUIPAMENTO p.152),
ferramentas, talentos, antecedentes, raças, deuses, idiomas, condições,
perícias, ações, pacotes de equipamento (nome+conteúdo), montarias e
veículos (terrestres + aquáticos), e as 13 classes (incluindo o
Patrulheiro — ver nota abaixo). Gaps que sobram estão na seção "Pendente"
logo abaixo (schema/escopo, não conteúdo de tradução em si).

### ~~Bloqueado~~ Resolvido — Patrulheiro (Ranger)

~~**Patrulheiro (Ranger) — classe inteira.** O texto impresso do PHB pt-BR
parece refletir as regras de 2014 pré-errata (...)~~ **Não era pré-errata.**
Investigação mais a fundo revelou que `books/Livro do Jogador.pdf` (p.115-122)
não é o PHB — é uma tradução fanmade do Unearthed Arcana "Ranger, Revised"
(2016) formatada pra imitar o livro oficial (dá pra ver isso pela
característica "Inimigo Favorito Maior", pelo bônus de dano fixo no Inimigo
Favorito e pelo 3º arquétipo "Conclave do Rastreador Subterrâneo" — nenhum
desses três existe no PHB real). O Patrulheiro oficial foi traduzido direto
de `books/D&D 5E - Player's Handbook.pdf` (que bate 100% com o banco) e o
conteúdo do UA foi preservado à parte como classe oculta (`source = 'UARR'`,
ver item "Patrulheiro (Revisado UA)" mais abaixo). Detalhes completos da
investigação em `translations/pt-BR/DUVIDAS.md`.

### Pendente

Ver board Trello "5e Character Hub", lista "A fazer" (bens de comércio/
bugigangas, multiclasse de talentos, sourcebooks além do PHB, arreios/
acessórios de montaria, 2 itens gerais do PHB ainda sem nome em pt-BR).

## Wizard de criação de personagem

Decisões de simplificação/adiamento tomadas durante a implementação do
wizard de criação de personagens (ver plano original em conversa com o
usuário).

- ~~Bloqueio dos campos de atributo após a criação do personagem + modal
  de detalhamento "base + bônus racial" ao tocar no campo~~ —
  **implementado**: na ficha, `CharacterAttributes`
  (`components/character/character-attributes.tsx`) renderiza cada
  atributo dentro de um `Pressable` que abre um `StatBreakdownModal`
  (`components/character/stat-breakdown-modal.tsx`) com as linhas "Base"
  e "Bônus Racial"; `AbilityCard`/`EditableStat`
  (`components/character/ability-card.tsx`) só fica editável quando
  recebe `onScoreChange`, que a ficha nunca passa — os campos ficam
  travados fora do wizard de criação. O mesmo padrão (travado + modal de
  detalhamento) também foi aplicado a testes de resistência, perícias e
  ferramentas, não só atributos.
- ~~Alternativa de Especialização do Ladino "1 perícia + proficiência em
  ferramentas de ladino" (em vez de "2 perícias")~~ — **implementado**:
  `ToolState` (`types/character.ts`) ganhou `expertise: boolean`, igual a
  `Skill`. No passo 4 do wizard (`app/wizard/background.tsx`), quando o
  personagem tem proficiência em ferramentas de ladrão (classe e/ou
  antecedente, detectado via `getToolItemByEnglishName` em
  `data/queries/tools.ts`), aparece um checkbox que troca uma das duas
  perícias de Especialização pela ferramenta (`WizardDraft.
expertiseToolChoice`, guarda a `itemKey()` da ferramenta escolhida);
  `data/wizard/assemble-character.ts` grava o `expertise: true`
  correspondente em `character.tools`. Na ficha, `ToolRow`
  (`components/character/tool-row.tsx`) passou a usar
  `SkillProficiencyToggle` (mesmo componente 3-estados de perícia) em vez de
  um checkbox simples, e o modal de detalhamento em
  `character-attributes.tsx` dobra o bônus de proficiência quando aplicável.
- ~~Perícia duplicada entre antecedente, raça e classe (card Trello
  "Corrigir perícia duplicada...")~~ — **corrigido**: PHB p.127
  ("Proficiências") diz que, ao colidir, o personagem "pode escolher outra
  proficiência do mesmo tipo (perícia ou ferramenta)" em vez da repetida -
  não talento/idioma, como o card sugeria (checado e descartado). Duas
  lacunas: (1) o pool de escolha da classe (`app/wizard/background.tsx`) não
  excluía as perícias já escolhidas na "Versatilidade em Perícias" do
  Meio-Elfo (só excluía antecedente + raça fixa), permitindo duplicata
  silenciosa que o `Set` de `assemble-character.ts` absorvia sem avisar; (2)
  quando a filtragem esvaziava a lista restrita da classe abaixo do `count`
  exigido (ex.: Clérigo, só 5 opções), não havia substituto, travando o
  wizard. `data/wizard/skill-proficiency-resolver.ts` ganhou
  `resolveSkillChoicePool(clause, alreadyGranted)`: filtra as já concedidas
  e, se sobrarem menos opções que `count`, abre todas as perícias ainda não
  concedidas (não só uma "de preenchimento" escolhida arbitrariamente pela
  ordem do array). Aproveitando a correção, a escolha racial do Meio-Elfo
  também migrou do Passo 4 (`background.tsx`) para o Passo 1
  (`app/wizard/index.tsx`), junto com bônus de atributo/linhagem dracônica -
  como raça é escolhida antes de classe/antecedente no wizard, isso elimina
  de vez a colisão em vez de só filtrá-la (nada para excluir ainda nesse
  passo) e deixa o fluxo mais natural para o jogador. `background.tsx` passou
  a ler `draft.raceSkillChoices` como grant fixo (igual às perícias fixas de
  Elfo/Meio-Orc), sem estado/lista de escolha própria. Achado no processo: o
  Humano Variante ("uma perícia à sua escolha") também tem esse `choose`,
  gravado em `races.skill_proficiencies` da linha "Variant" (id 186, fonte
  PHB, `{"any":1}`), não da linha base "Human" - o comentário em
  `db/schema.sql` dizia que só Elfo/Meio-Elfo/Meio-Orc tinham esse campo, o
  que estava errado (corrigido). Como o `raceSkillClause` do Passo 1 já lê
  raça + sub-raça de forma genérica, o Variante ganhou a escolha de perícia
  de graça, sem código extra.
- ~~Regressão: perícia racial escolhida no Passo 1 colidindo com o
  antecedente do Passo 4 (achado ao vivo: Meio-Elfo Clérigo/Acólito,
  escolheu Religião na raça, Acólito também fixa Religião - a escolha
  "sumia" ao fechar a ficha)~~ — **corrigido**. Efeito colateral direto da
  mudança acima: mover a escolha racial pro Passo 1 resolve a colisão
  contra classe/antecedente-já-escolhido quando a raça é escolhida
  *depois*, mas não cobre o caso oposto - antecedente é fixo (não é um
  pool, não tem como "excluir" nada dele), e é escolhido *depois* da raça,
  então uma perícia já escolhida na raça pode colidir com o antecedente sem
  nenhum aviso, perdida em silêncio pelo `Set` de `assemble-character.ts`
  (mesma classe de bug do card original, ângulo diferente).
  `app/wizard/background.tsx` agora detecta
  `raceSkillChoiceCollisions` (interseção entre `draft.raceSkillChoices` e
  as perícias fixas do antecedente) e, quando não-vazia, abre uma seção
  "Perícias raciais — substituição por colisão" com `resolveSkillChoicePool`
  oferecendo `count = colisões.length` substitutas (qualquer perícia ainda
  não concedida); `raceSkills` (usado pra excluir do pool da classe e pra
  exibição) passou a ser fixo + escolhas-da-raça-não-colididas + essas
  substitutas, e a lista final é regravada em `draft.raceSkillChoices` (via
  `setRaceSkillChoices`, reimportado nesta tela) só quando há colisão.
- ~~Magia de domínio fora da lista da classe não aparecia na ficha (ex.:
  Identificação do Domínio do Conhecimento)~~ — **corrigido**: achado ao
  vivo num Clérigo Meio-Elfo com Domínio do Conhecimento, que mostrava
  Comando como magia de domínio mas não Identificação, a outra magia de
  1º nível do domínio. `components/character/character-spells.tsx` já
  resolvia `getSubclassAdditionalSpellsByLevel` em `domainSpellIds` e
  marcava corretamente como sempre-preparada qualquer magia de domínio já
  presente na lista normal da classe (Comando é magia de Clérigo) - mas
  nunca mesclava esse id na lista `spells` de fato buscada quando a magia
  de domínio não pertence à lista normal (Identificação é magia de Mago,
  não de Clérigo). O efeito que busca `spells` para "full-list casters"
  (Clérigo/Druida) só mesclava ids extras vindos de `character.spells`
  (usado pro caso de magia racial fora da lista, ex. Taumaturgia de
  Tiefling); passou a mesclar também `domainSpellIds`. Afeta os 7
  Domínios do Clérigo do PHB core - na época, ainda faltavam Círculo da
  Terra do Druida e patronos do Bruxo (ver entrada mais abaixo - patronos
  do Bruxo corrigidos depois; Círculo da Terra virou card à parte).
- ~~Distinção fina entre "magia conhecida" e "magia preparada hoje"~~ —
  **corrigido**: achado ao vivo num Mago nível 1 com INT +1, que mostrava
  "6/2" preparadas (grimório de 6 marcado todo como preparado, contra um
  teto real de 2 pela fórmula mod.INT + nível). Só o Mago tem grimório de
  tamanho fixo (`spellsKnownFixed`) E teto de preparo calculado à parte
  (`maxPreparedFormula`) ao mesmo tempo — `data/wizard/assemble-character.ts`
  agora detecta essa combinação e grava `prepared: false` para as magias
  dessas classes na criação, deixando o jogador escolher o que preparar pelo
  toggle que já existe na aba Magias. Clérigo/Druida (preparam da lista
  completa, etapa de criação já limita a escolha ao teto) e
  Bardo/Feiticeiro/Bruxo (conjuradores "conhecidos", sem preparo diário)
  continuam nascendo com tudo preparado, sem mudança.
- ~~Cobertura do parser de texto livre de proficiência em ferramentas de
  antecedente~~ — **não foi necessário**: descobri que `backgrounds.entries`
  (banco) tinha os cabeçalhos "Tool Proficiencies:"/"Skill Proficiencies:"/
  "Equipment:" mas com o conteúdo de lista real **descartado** pelo
  `scripts/import-5e-data.mjs` (o import só extrai texto solto, não os
  blocos `{type:'list', items:[...]}` do 5etools). Em vez de parsear texto
  incompleto, confirmei que o dado bruto (`5e-2014-data/backgrounds.json`)
  já tem um campo estruturado `toolProficiencies` (mesmo formato de
  `classes.starting_proficiencies.toolProficiencies`) que simplesmente não
  virava coluna — adicionei `backgrounds.tool_proficiencies` em
  `db/schema.sql`, atualizei o import script para populá-la e rodei
  `npm run db:import` + `npm run db:translate` de novo. Proficiência de
  ferramentas de antecedente agora é estruturada, igual à de perícias.
- ~~Conferir se outros campos de antecedente sofrem do mesmo problema~~ —
  **conferido, nada sobrou**: os 4 campos brutos que um antecedente da PHB
  pode ter (`skillProficiencies`, `toolProficiencies`,
  `languageProficiencies`, `startingEquipment`) já têm coluna própria
  (`skill_proficiencies`/`tool_proficiencies`/`language_proficiencies`/
  `starting_equipment`) e são importados corretamente por
  `scripts/import-5e-data.mjs`. Achado ao conferir especificamente
  `language_proficiencies` (e a coluna equivalente em raça,
  `races.languages`): a coluna era gravada certinho no banco mas **nunca
  lida em lugar nenhum do app** — não existia `data/queries/languages.ts`,
  o wizard não tinha passo de escolha de idiomas, e `CharacterSheet` não
  tinha nenhum conceito de "idiomas" do personagem. Virou feature nova,
  implementada na mesma sessão: `data/queries/languages.ts` (catálogo,
  espelha `data/queries/tools.ts`), `data/wizard/language-proficiency-
resolver.ts` (parse da DSL `{name:true}`/`{anyStandard:N}`, mesma
  convenção de `tool_proficiencies`), novo passo "Idiomas" dentro do Passo 4
  do wizard (`app/wizard/background.tsx`, `components/wizard/language-
choice-list.tsx`) cobrindo idioma fixo + escolha de raça e antecedente
  (incluindo o caso do Elfo Alto, cuja sub-raça **sobrescreve** o
  `languageProficiencies` da raça-base em vez de somar), `CharacterSheet.
languages: number[]` persistido em `data/wizard/assemble-character.ts`, e
  exibido na aba Atributos (`components/character/character-attributes.tsx`).
  A pedido do usuário, também cobre os dois idiomas concedidos por
  _característica de classe_ em vez da DSL de proficiência (Druídico do
  Druida, Gíria de Ladrão do Ladino, ambos nível 1) — o nome da própria
  característica bate exatamente com o nome do idioma no catálogo, então
  `getClassGrantedLanguageNames` (mesmo arquivo do resolver) casa por uma
  pequena lista explícita em vez de inferência genérica, mesmo padrão já
  usado por `VEHICLE_PROFICIENCY_LABELS` no resolver de ferramentas.
- ~~**Mapeamento de `equipmentType`**~~ — resolvido: conferi ao vivo contra
  `starting_equipment` de todas as classes e antecedentes do PHB (não só as
  verificadas no planejamento original) e são exatamente 9 códigos:
  `weaponMartial(Melee)`, `weaponSimple(Melee)`, `instrumentMusical`,
  `toolArtisan`, `focusSpellcasting(Arcane|Druidic|Holy)`. Todos cobertos em
  `EQUIPMENT_TYPE_FILTERS` (`data/queries/equipment-lookup.ts`) e
  `EQUIPMENT_TYPE_LABELS` (`constants/equipment-types.ts`) — faltava
  `toolArtisan`, causava o dropdown de categoria vazio pro Artesão da
  Guilda, corrigido.
- ~~**Forasteiro dava "Cajado" (foco arcano) em vez de "Bordão" (arma)**~~ —
  resolvido: o `starting_equipment` bruto do antecedente Outlander
  referencia `"staff|phb"`, que resolve por nome exato para `base_items` id
  106 ("Staff", tipo `SCF`, Foco Arcano, traduzido "Cajado") em vez de id 82
  ("Quarterstaff", arma simples, traduzido "Bordão" — o item que o PHB
  traduzido realmente lista ali). Achado ao vivo num personagem
  Bárbaro+Forasteiro de teste. É um dado errado que já vem do 5etools
  (confirmado único no `5e-2014-data/backgrounds.json` via grep, não é
  problema sistêmico de nomenclatura). Corrigido com um mecanismo de
  override genérico (`db/overrides/equipment-ref-fixes.json` +
  `applyEquipmentRefFixes()` em `scripts/import-5e-data.mjs`, aplicado a
  `classes.starting_equipment` e `backgrounds.starting_equipment`) em vez de
  um caso especial hardcoded — deixa pronto pra qualquer achado parecido no
  futuro só editando o JSON.
- ~~Traduções faltando: "Explorer's Pack"/"Scholar's Pack".~~ —
  **resolvido**: achado ao vivo consertando o Passo 5 (Equipamento) -
  esses dois itens do PHB não tinham NENHUMA linha em `translations` (nem
  `name` nem `entries`), diferente de outros itens que já têm nome
  traduzido. `translations/pt-BR/PHB/items.json` agora tem `name` +
  `entries` completos para `"Scholar's Pack|PHB"` ("Pacote de Estudioso")
  e `"Explorer's Pack|PHB"` ("Pacote de Explorador") — passou pelo
  pipeline formal de tradução, não só o `name` mínimo pedido originalmente.
- ~~Mostrar o conteúdo dos pacotes/kits no Passo 5~~ — **implementado**:
  `EquipmentLookupItem`/`ResolvedEquipmentEntry` (`data/queries/
equipment-lookup.ts`, `data/wizard/equipment-resolver.ts`) agora carregam
  as `entries` traduzidas dos 7 pacotes multi-item (sinal estrutural
  `isMultiItemPack()` em `data/queries/base-items.ts`, não depende do texto
  "Inclui:" continuar igual), e `equipment-choice-group.tsx` mostra o
  conteúdo como texto de apoio abaixo do nome (fonte menor, esmaecido,
  `numberOfLines={2}` pra não estourar o card nos pacotes maiores).
  Achado durante essa mudança: o filtro de Símbolo Sagrado em
  `equipment-lookup.ts` ainda buscava `name IN ('Sinete', 'Sino')` — ficou
  quebrado (silenciosamente) depois do rename Sinete→Signet da rodada de
  tradução; corrigido junto.
- ~~Deletar personagem~~ — **implementado**: via longpress na lista de
  Personagens.
- ~~Editar raça/classe/antecedente depois de criado~~ — **decisão de
  design do app**: não será permitido fazer isso; não é lacuna a
  implementar.
- ~~Duplicar personagem~~ — **decisão de design do app**: não existirá.
- ~~Itens "special" do equipamento resolvido não entram no inventário
  persistido.~~ — **resolvido**: as 19 entradas `{special: "...", quantity?:
N}` sem linha correspondente em `base_items`/`items` (9 antecedentes do
  PHB: Acólito/Artesão de Guilda/Artista/Charlatão/Nobre/Forasteiro/Sábio/
  Soldado/Órfão) ganharam linhas sintéticas reais na tabela `items`
  (`db/overrides/custom-items.json`, mesmo mecanismo já usado pra
  "Signet"/embarcações aquáticas), com peso 0 e a `entries` reaproveitando o
  texto de flavor já traduzido. `EQUIPMENT_SPECIAL_ITEM_REFS`
  (`data/wizard/equipment-resolver.ts`) redireciona cada texto pra sua linha
  sintética, então `parseRawEntry` trata como `kind: 'pendingItem'` — mesmo
  caminho de resolução/estoque/persistência/tela de detalhe de qualquer
  outro item, sem código novo em `assemble-character.ts` ou na UI. Só
  "Sticks of Incense" (varetas de incenso, `quantity: 5`) ganhou
  `details.miscTags: ["CNS"]` pra virar `consumable`; o resto é `general`.
  Como efeito colateral, resolve também o item abaixo pra esses 19 casos,
  já que deixam de ser `kind: 'special'`.
- ~~Quantidade de arma/armadura não aparece em lugar nenhum da UI~~ —
  **implementado (abordagem 2, itens separados)**: `inventoryItems` deixou
  de ser `Record<itemKey, InventoryItemState>` e virou `Record<instanceId,
InventoryItemState>` — cada registro é uma unidade física, com
  `InventoryItemState.itemId` guardando a referência de catálogo
  (`types/character.ts`). `assemble-character.ts` agora consulta
  `getBaseItemCategoriesByIds` (`data/queries/base-items.ts`) e, pra
  arma/armadura (não-stackável), cria uma instância por unidade concedida em
  vez de somar quantidade num registro só — 2x Machadinha vira 2 cards na
  Mochila, cada um com seu próprio `weaponSlot`, permitindo dual-wield real.
  Itens empilháveis (consumível/geral) continuam somando numa instância só,
  como antes. `character-inventory.tsx`, a tela de detalhe de item
  (`app/sheet/[characterId]/item/[id].tsx`) e `hooks/use-equipped-armor.ts`
  passaram a navegar/ler pelo id de instância, resolvendo o catálogo via
  `state.itemId`. Saves antigos (sem `itemId`) recebem uma migração de forma
  na leitura (`data/queries/player-characters.ts`) que evita crash mas não
  separa retroativamente uma pilha antiga de arma/armadura em instâncias —
  personagens de teste já criados antes dessa mudança precisam ser apagados
  e recriados pra ganhar o comportamento novo.
- ~~Colisão de id entre `base_items` e `items`~~ — **corrigido**: as duas
  tabelas têm ids autoincrementais independentes e algumas linhas realmente
  colidem (ex. id 18 = "Chain Mail" em `base_items` e "+2 Moon Sickle" em
  `items`). `CharacterSheet.inventoryItems`/`.tools` agora usam `itemKey()`/
  `parseItemKey()` de `data/queries/equipment-lookup.ts` (prefixo `item:`
  para `items`, sem prefixo para `base_items`), e `character-inventory.tsx`/
  `hooks/use-equipped-armor.ts` foram atualizados para entender o prefixo.
- ~~A aba Inventário não renderiza o inventário real do personagem~~ —
  **corrigido**: `character-inventory.tsx` deixou de usar a lista fixa
  "curada" (`getCuratedInventoryBaseItems`, removida) e passou a resolver
  dinamicamente os ids presentes em `character.inventoryItems` (via
  `getBaseItemsByIds`/`getItemsByIds`), mesmo padrão da seção "Ferramentas"
  da aba Atributos. Ressalva histórica (não se aplica mais, ver item
  abaixo): itens vindos da tabela `items` (kits, sacos de aventureiro)
  chegaram a ficar sem navegação para tela de detalhe por um tempo.
- ~~Tela de detalhe de item não cobre a tabela `items`.~~ — **resolvido**:
  `app/sheet/[characterId]/item/[id].tsx` (provavelmente como efeito
  colateral da migração pra inventário baseado em instâncias,
  `InventoryItemState.itemId`) agora resolve o `itemId` da instância via
  `parseItemKey` e chama `getBaseItemDetailById` ou `getItemDetailById`
  (`data/queries/item-detail.ts`) dependendo da origem (`base_items` vs
  `items`) — itens de `items` (kits, sacos de aventureiro, instrumentos
  mágicos etc.) já abrem tela de detalhe normalmente.
- **Achado ao investigar o bug de raças/sub-raças "soltas":** o import
  (`scripts/import-5e-data.mjs`) tinha um bug de verdade — `insertRaceRow`
  registrava QUALQUER linha inserida em `raceMap` (inclusive sub-raças), e
  quando duas sub-raças do mesmo pai tinham o mesmo nome resolvido (caso do
  Humano: a entrada "padrão", sem `name` próprio, e a "Variante"), a segunda
  acabava filha da primeira em vez do pai de verdade. Corrigido (só raças-
  base se registram em `raceMap` agora) + tratamento das sub-raças
  "fantasma" sem `name` e sem `ability` (Draconato, Meio-Elfo, Meio-Orc,
  Tiefling no PHB — dados confirmados vazios em `5e-2014-data/races.json`,
  não é perda de informação) + fusão do bônus "sem nome próprio" do Humano
  padrão direto na raça-base em vez de virar uma sub-raça homônima
  confusa. Se `npm run db:import` for alterado de novo, vale reler esse
  trecho antes de mexer na seção `races`.
- **~~Inimigo Favorito/Explorador Natural do Patrulheiro (1º nível) fora do
  wizard~~ Resolvido.** O Patrulheiro tem duas escolhas obrigatórias de 1º
  nível (tipo de inimigo favorito + terreno favorito, esse último dentro da
  característica "Explorador Natural"). Ao contrário do Estilo de Luta do
  Guerreiro, essas opções não são linhas de `optional_features` no banco — no
  5etools/PHB elas são só texto corrido embutido no parágrafo da
  característica (`class_features`), sem catálogo próprio e sem flavor text
  por opção, e o app não tem tabela de bestiário pra dar nome às raças
  humanoides da alternativa "duas raças humanoides". Por isso a lista de
  opções virou constante no app (`constants/favored-enemy.ts`,
  `constants/favored-terrain.ts`), mesmo padrão já usado pra Linhagem
  Dracônica do Draconato (`constants/draconic-ancestry.ts`), com flavor text
  novo (não vindo do livro) escrito pra cada opção, incluindo exemplos de
  monstros conhecidos. UI em `app/wizard/class.tsx` (combos + caixa de
  descrição, mesmo estilo do Estilo de Luta), estado em
  `context/wizard-context.tsx`, persistência em `CharacterSheet`
  (`favoredEnemyType`/`favoredEnemyHumanoidRaces`/`favoredTerrainType`),
  exibição na aba Características e no detalhe da característica
  (`data/queries/character-features.ts`/`data/queries/feature-detail.ts`,
  mesmo mecanismo de anotar o nome/entries já usado pro Estilo de Luta).
- ~~Quantidade de itens "special" do equipamento inicial nunca aparece pro
  jogador.~~ — **resolvido como efeito colateral**: junto com o item acima
  ("itens 'special' não entram no inventário persistido"), as 19 entradas
  de flavor text (Acólito's "5 sticks of incense" incluído) deixaram de ser
  `kind: 'special'` e passaram a `kind: 'item'` via
  `EQUIPMENT_SPECIAL_ITEM_REFS` (`data/wizard/equipment-resolver.ts`) — esse
  `kind` já formata `${quantity}x ${label}` em `describeEntry()`
  (`components/wizard/equipment-choice-group.tsx`), sem precisar de mudança
  própria pra isso.
- ~~Grant de moeda solta no equipamento inicial (`{value: N}`, sem item) não
  soma na bolsa do personagem~~ — **corrigido**: achado ao consertar o
  Eremita (concede 5 po soltos, sem item, único caso desse formato na
  PHB). Descobri no mesmo processo que o Nobre tinha um problema parecido
  mas silencioso: sua "purse" (algibeira com 25 po) usa
  `{special: "purse", containsValue: ...}` em vez do
  `{item: "pouch|phb", containsValue: ...}` que os outros 11 antecedentes
  com bolsa de moedas usam — `parseRawEntry` nunca lia `containsValue` de
  uma entrada `special`, então os 25 po do Nobre eram descartados
  silenciosamente (só o texto "Algibeira" aparecia, sem valor). Duas
  correções em `data/wizard/equipment-resolver.ts`: (1) a "purse" do Nobre
  agora redireciona pro item de catálogo real `Pouch\|PHB` (mesmo item que
  os outros antecedentes já usavam, resolve/soma normalmente); (2) o
  grant solto do Eremita ganhou um campo `valueCp` no `kind: 'special'`,
  somado por `assemble-character.ts` junto com `containsValueCp` (variável
  renomeada de `goldFromContainers` pra `goldFromEquipment`, já que cobre
  os dois casos agora).
- ~~`Book` (item, id 182) estava com o texto de `Spellbook` (id 1354) por
  engano~~ — **corrigido, confirmado pelo usuário**: o item que o Mago
  recebe na criação é mesmo o `Spellbook`/Grimório; `Book` é um item
  genérico à parte. `Book\|PHB` ganhou nome ("Livro") e descrição próprios,
  traduzidos do texto em inglês real do item, em vez de reaproveitar o
  texto do Grimório.
- ~~Lista expandida de magias dos Patronos do Bruxo (Arquifada, Corruptor,
  Grande Antigo) não aparecia como opção na criação~~ — **corrigido**: PHB
  concede a esses 3 patronos (os únicos com `source='PHB'`) uma "expanded
  spell list" — magias de OUTRAS classes que o Bruxo pode escolher como
  conhecida, mecânica distinta da "sempre-preparada" dos Domínios do
  Clérigo (essa usa a chave `prepared`; a do Bruxo usa `expanded`, ambas em
  `additionalSpells` no dado bruto). O filtro de import só aceitava
  `prepared`, então `subclasses.additional_spells` ficava `null` pros 3
  patronos e `app/wizard/spells.tsx` nunca oferecia essas magias (ex.:
  Sono/Fogo das Fadas da Arquifada) entre as 2 conhecidas de 1º nível.
  `additional_spells` passou a guardar `{kind: 'prepared'|'expanded',
  byLevel: {...}}` (`scripts/import-5e-data.mjs`,
  `data/queries/classes.ts` ganhou `getSubclassExpandedSpellsByLevel` ao
  lado da já existente `getSubclassAdditionalSpellsByLevel`, sem mudar o
  comportamento dela), e a tela de magias da wizard mescla as opções `s1`
  do patrono na lista de magias de 1º nível selecionáveis. Círculo da
  Terra do Druida continua de fora (sub-escolha de bioma nomeada, mesmo
  caso do patrono Genie) — não bloqueia criação nível 1 porque Círculo é
  concedido só no nível 2 e o wizard nem pergunta subclasse de Druida
  hoje; ver card Trello "Círculo da Terra do Druida: magia bônus por
  bioma".
- ~~Persistir proficiências "livres" (sem item de catálogo) na ficha~~ —
  **resolvido**: proficiências de ferramenta que resolvem pra `kind:
  'special'`/`'unresolved'` em vez de um item de catálogo (ex.: "Veículos
  (terrestres/aquáticos)" do Herói do Povo/Soldado/Marinheiro, ver
  `data/wizard/tool-proficiency-resolver.ts`) eram descartadas
  silenciosamente em `assemble-character.ts` (`if (entry.kind !== 'item')
  continue`). Novo campo `CharacterSheet.freeformToolProficiencies?:
  string[]` (`types/character.ts`) guarda esses textos; exibidos como linhas
  simples no fim da seção "Ferramentas" da aba Atributos
  (`character-attributes.tsx`), sem toggle de proficiente/especialização
  (não faz sentido pra esse tipo de entrada).

  Investigando a mesma classe de bug, achei duas lacunas irmãs, corrigidas
  junto:
  - Conteúdo `special` de pacote multi-item também era descartado um nível
    mais fundo (`getMultiItemPackContents`, `data/queries/base-items.ts`,
    filtrado fora em `data/queries/equipment-lookup.ts`) — afetava Pacote de
    Ladrão ("10 feet of string"), Pacote de Sacerdote ("alms box"/"block of
    incense" x2/"censer"/"vestments") e Pacote de Estudioso ("little bag of
    sand"/"small knife"). Mesmo mecanismo já usado pros 19 itens `special`
    de antecedente (ver item acima): 5 linhas sintéticas novas em
    `db/overrides/custom-items.json` + entrada em
    `EQUIPMENT_SPECIAL_ITEM_REFS` (`data/wizard/equipment-resolver.ts`),
    agora também consultada por `resolvePackContentRef` (que passou a
    aceitar o `MultiItemPackEntry` completo, não só entradas `kind: 'item'`).
  - `app/wizard/equipment.tsx` e `app/wizard/background.tsx`: o gate
    `canProceed` só bloqueava avanço em `categoryChoice` não resolvido;
    passou a bloquear também em `kind: 'unresolved'` (DSL não reconhecido,
    sem picker de recuperação) — não em `'special'`, que agora é persistido
    de propósito.

  Achados durante a validação manual (não são regressão da mudança acima,
  mas bugs adjacentes que ela expôs):
  - `character-inventory.tsx` só respeitava a quantidade real armazenada
    (badge + peso exibido) quando `def.category === 'consumable'`; qualquer
    outro item da tabela `items` sempre mostrava quantidade "1", mesmo com
    mais unidades guardadas. Corrigido pra usar a quantidade real sempre (a
    badge só aparece quando > 1, pra não poluir os itens comuns de
    quantidade única). "Block of Incense" também ganhou
    `details.miscTags: ["CNS"]` (igual a "Sticks of Incense") pra virar
    `consumable` de verdade.
  - Pacote de Estudioso: o `packContents` bruto lista "parchment (one
    sheet)|phb" como referência solta (quantidade implícita 1), mas o texto
    do próprio pacote diz "10 sheets of parchment" — conferido nos 7 pacotes
    multi-item da PHB, é a única inconsistência desse tipo. Corrigido com
    uma tabela de correção pontual por pacote+item
    (`PACK_CONTENT_QUANTITY_OVERRIDES`, `data/queries/base-items.ts`), não
    global por referência (o mesmo item significa quantidade 5 em outro
    contexto, a capacidade do item "Case, Map or Scroll").
  - `scripts/import-translations.mjs` fazia ~900 inserções sem transação,
    o que no Windows criava/apagava o journal file do SQLite a cada linha —
    demorava 20+ minutos (ou travava de vez, dependendo do antivírus/outros
    processos com o arquivo aberto). Envolvido em `BEGIN`/`COMMIT`; roda em
    menos de 1 segundo agora.

- **Cross-check de criação de 1º nível vs. PHB, direto no código (2026-08-19)**
  — não achado por teste ao vivo no celular, mas lendo os 7 passos do wizard
  + resolvers inteiros contra as regras do PHB, classe a classe/raça a raça
  (continuação do cross-check de 2026-08-18 que gerou os cards #42 e #44).
  Quatro lacunas, nenhuma delas registrada em card antes — **todas
  resolvidas na mesma sessão**:
  - `RACE_GRANTED_CANTRIPS` (`constants/spellcasting.ts`) só cobria o
    Tiefling (Taumaturgia) — faltavam Drow (Luzes Dançantes, "Drow Magic")
    e Gnomo da Floresta (Ilusão Menor, "Natural Illusionist"), e pior: a
    função só olhava o nome da raça-base, nunca o da sub-raça, então um
    grant de sub-raça como esses dois nunca teria funcionado mesmo estando
    na tabela. `getRaceGrantedSpellIds` (`data/wizard/
    race-granted-spells.ts`) agora recebe raça e sub-raça e olha as duas.
  - "Dwarven Toughness" do Anão da Colina (+1 PV no 1º nível) nunca entrava
    no cálculo de PV máximo (`data/wizard/assemble-character.ts`), apesar
    dos bônus irmãos (Resiliência Dracônica do Feiticeiro, talento Rústico)
    estarem bem ao lado no mesmo cálculo.
  - Profíciência em ferramentas do Anão ("escolha entre ferramentas de
    ferreiro/apetrechos de cervejeiro/ferramentas de pedreiro") e do Gnomo
    da Rocha (ferramentas de reparo, fixa) não tinham nem coluna no schema
    — `races` (`db/schema.sql`) só tinha perícia/armadura/arma/idioma, nunca
    ferramenta, então essas duas características do PHB não podiam ter sido
    importadas, muito menos oferecidas no wizard. Adicionada
    `races.tool_proficiencies` (mesmo formato de `backgrounds.
    tool_proficiencies`), populada no import
    (`scripts/import-5e-data.mjs`) e exposta em `data/queries/races.ts`.
    Como a escolha do Anão é "3 ferramentas nomeadas", não "qualquer
    ferramenta de artesão" (~17 opções), ganhou um tipo de escolha novo,
    `ResolvedEquipmentEntry.namedChoice` (`data/wizard/
    equipment-resolver.ts`), distinto do `categoryChoice` já existente.
  - `assembleCharacter` só validava `raceId`/`classId`/`backgroundId`
    não-nulos, confiando que o `canProceed` de cada passo já teria barrado
    qualquer outra coisa faltando — mas o `<Stack>` do expo-router não
    impede estruturalmente chegar no passo Detalhes fora de ordem (ex.
    voltar/avançar pelo navegador numa build web). Ganhou uma checagem de
    presença (não de contagem exata — isso continua sendo papel do
    `canProceed` de cada passo) pra cada escolha obrigatória antes de montar
    a ficha; `app/wizard/details.tsx` agora mostra um alerta em vez de
    travar em silêncio se isso algum dia disparar.

  Achada e corrigida uma regressão introduzida pela própria correção da
  ferramenta do Anão, validada ao vivo pelo usuário (Anão da Colina +
  Artesão da Guilda + Guerreiro): juntar a ferramenta da raça no mesmo pool
  de ferramentas de classe+antecedente quebrou a reconciliação "mesmo tipo
  que sua proficiência em ferramentas" do Passo 5 Equipamento
  (`data/wizard/tool-equipment-overlap.ts`) sempre que a escolha de artesão
  do Anão caía na mesma categoria ampla de um grant não-relacionado (ex. o
  próprio "qualquer ferramenta de artesão" do Artesão da Guilda) — a
  reconciliação só auto-trava quando existe exatamente uma ferramenta
  daquela categoria já concedida, e duas concessões não-relacionadas da
  mesma categoria ampla faziam ela desistir, abrindo um segundo combo
  confuso e não-preenchido em vez de travar automaticamente. Ferramentas de
  raça/sub-raça agora resolvem pro próprio campo do draft
  (`raceToolProficiencies`, `context/wizard-context.tsx`), mostradas juntas
  com as de classe/antecedente numa lista só no Passo 4 pro jogador, mas
  mantidas separadas pra reconciliação do Passo 5 e só remescladas na hora
  de montar a ficha final.

  Uma quinta lacuna (truque à escolha do Elfo Alto, "Cantrip" — magia de
  Mago à escolha, PHB p.24) precisava de UI/estado novos em vez de uma
  correção pontual, então virou card Trello #45 em vez de ser resolvida
  nessa sessão.

Pendências restantes (multiclasse, sourcebooks além do PHB, Patrulheiro UA,
Humano Variante/talentos, magias de subclasse com escolha adicional,
template de ancestralidade, Ataque Furtivo no dano da arma, encumbrance
opcional, truque à escolha do Elfo Alto, e as pós-level-up no checklist do
card "Implementar o Lvl Up de personagem"): ver board Trello "5e Character
Hub", lista "A fazer".

## Testes automatizados

- **Análise: consertar o bug de Expo Web (OPFS) vs. implementar testes
  unitários (2026-08-19)** — testes manuais de regressão (raça × classe ×
  subclasse × antecedente, um a um no celular) ficaram caros demais depois
  que um bug de OPFS (`FileSystemSyncAccessHandle` só permite um handle por
  arquivo, `app/_layout.tsx`) passou a impedir testar pelo Expo Web de forma
  confiável. Investigação: o motor de regras (`data/wizard/*.ts`,
  `utils/*.ts`) já é desacoplado de React/React Native, então testes
  unitários em Node puro saíam mais baratos e davam cobertura combinatória
  real - resolver o OPFS continuaria dependendo de um humano clicar na
  wizard, e nunca cobriria "quase 100% das combinações" de forma viável.
  Testes unitários venceram; OPFS/web ficou de fora desta rodada (card
  Trello #46 documenta a decisão completa e o que foi implementado).
- **Suíte de testes de criação de personagem nível 1 (PHB), implementada
  (2026-08-19)** — Vitest rodando puro em Node (`npm test`, sem
  emulador/navegador/jest-expo). `tests/support/sqlite-adapter.ts` expõe
  `assets/data/dnd5e.db` via `node:sqlite` no shape do `SQLiteDatabase` do
  expo-sqlite, reaproveitando as queries reais do app sem alteração.
  `tests/support/build-test-draft.ts` monta um `WizardDraft` completo e
  válido sem interação humana, reaproveitando os resolvers reais da wizard
  (sempre a primeira opção válida, determinístico).
  `tests/support/level1-matrix.ts` gera a matriz exaustiva **direto do
  banco** (não hardcoded) - 15 variantes de raça/sub-raça × 21 de
  classe/subclasse × 13 antecedentes = 4095 combinações de nível 1 do PHB.
  `tests/character-creation/level1-phb-matrix.test.ts` chama
  `assembleCharacter` pra cada combinação e verifica PV/CA/salvaguardas
  contra a regra do PHB, com comentário citando a página/traço quando é
  regra específica. `data/wizard/step-validation.ts` extraiu os
  `canProceed` de Raça/Classe da wizard pra funções puras testáveis
  (Antecedente/Equipamento ficaram de fora, acoplados a estado local por
  índice). Documentação completa (cobertura, estratégia, como estender) em
  `docs/testing.md`. Fase 2 (testes de componente pra bugs de exibição, não
  só de dado) registrada como próximo passo, não implementada.
