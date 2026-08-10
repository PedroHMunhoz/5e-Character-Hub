# TODO — Wizard de criação de personagens

Decisões de simplificação/adiamento tomadas durante a implementação do
wizard de criação de personagens (ver plano original em conversa com o
usuário). Mesmo espírito do `translations/pt-BR/DUVIDAS.md`: registrar aqui
em vez de deixar só na memória da conversa, para revisitar depois.

- **Perícia duplicada entre antecedente, raça e classe.** O pool de escolha
  de perícias da classe remove a(s) perícia(s) já concedida(s) pelo
  antecedente e pela raça (Elfo/Meio-Orc fixas, Meio-Elfo à escolha); o pool
  de escolha racial do Meio-Elfo por sua vez remove as já concedidas por
  antecedente/raça-fixa/classe-já-escolhida. O RAW diz que, nesse caso, o
  jogador ganha um talento ou proficiência em idioma à escolha em vez da
  perícia repetida — não implementado.
- **Bloqueio dos campos de atributo após a criação do personagem** + modal
  de detalhamento "base + bônus racial" ao tocar no campo. O dado
  (`AbilityScore.base`/`.racialBonus`) já fica persistido separado para
  viabilizar isso no futuro, mas a UI de bloqueio/detalhamento não é
  construída nesta feature.
- **Alternativa de Especialização do Ladino "1 perícia + proficiência em
  ferramentas de ladino"** (em vez de "2 perícias"). O modelo `tools` já
  fica próximo o bastante de `Skill` para ganhar `expertise` no futuro sem
  retrabalho, mas essa interação específica não é construída agora.
- **Compra efetiva de itens com o PO** da opção B do passo de Equipamento —
  pedido explícito do usuário para ficar para depois ("posteriormente
  comprar os itens").
- **Distinção fina entre "magia conhecida" e "magia preparada hoje"** além
  do toggle que já existe na aba Magias — o wizard grava todas as magias
  escolhidas como preparadas na criação.
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
- **Conferir se outros campos de antecedente sofrem do mesmo problema**
  (conteúdo descartado pelo import em vez de virar coluna própria) — só
  verifiquei "Tool Proficiencies:"; "Skill Proficiencies:"/"Equipment:" já
  tinham colunas estruturadas próprias (`skill_proficiencies`/
  `starting_equipment`) que continuam corretas, mas vale conferir se sobrou
  algum outro cabeçalho nessa situação em antecedentes fora do PHB.
- ~~**Mapeamento de `equipmentType`**~~ — resolvido: conferi ao vivo contra
  `starting_equipment` de todas as classes e antecedentes do PHB (não só as
  verificadas no planejamento original) e são exatamente 9 códigos:
  `weaponMartial(Melee)`, `weaponSimple(Melee)`, `instrumentMusical`,
  `toolArtisan`, `focusSpellcasting(Arcane|Druidic|Holy)`. Todos cobertos em
  `EQUIPMENT_TYPE_FILTERS` (`data/queries/equipment-lookup.ts`) e
  `EQUIPMENT_TYPE_LABELS` (`constants/equipment-types.ts`) — faltava
  `toolArtisan`, causava o dropdown de categoria vazio pro Artesão da
  Guilda, corrigido.
- **Traduções faltando: "Explorer's Pack"/"Scholar's Pack".** Achado ao
  vivo consertando o Passo 5 (Equipamento) - esses dois itens do PHB não
  têm NENHUMA linha em `translations` (nem `name` nem `entries`), diferente
  de outros itens que já têm nome traduzido. Aparecem em inglês na tela do
  wizard mesmo depois do fix de resolução de item (não é bug de código).
  Pedido explícito do usuário: priorizar pelo menos o `name` desses dois
  pacotes (ex. "Pacote do Explorador"/"Pacote do Erudito") - `entries`
  (conteúdo) pode vir depois. Passar pelo pipeline formal de tradução
  (`translations/pt-BR/` + `DUVIDAS.md`) quando for a vez desses itens.
- **Mostrar o conteúdo dos pacotes/kits no Passo 5.** Combinado com o
  usuário: por ora as opções de equipamento (`components/wizard/
  equipment-choice-group.tsx`) mostram só o nome do item (ex. "Pacote do
  Explorador"), sem a lista de conteúdo (`items.entries`, ex. "Inclui:
  mochila, saco de dormir, ..."). Quando os itens relevantes (packs/kits)
  tiverem `entries` traduzidas, expor esse campo em `EquipmentLookupItem`/
  na resolução (hoje só carrega `id`/`source`/`name`/`englishName`) e
  mostrar como texto de apoio abaixo de cada opção, como no mockup de
  referência que o usuário mandou.
- **Fluxo de multiclasse** (adicionar uma segunda classe depois de criado o
  personagem) — o wizard só cria o 1º nível de uma única classe.
- **Editar raça/classe/antecedente depois de criado; deletar/duplicar
  personagem** — nenhuma dessas ações existe ainda na lista de Personagens.
- **Itens "special" do equipamento resolvido não entram no inventário
  persistido.** Entradas como `{special: "sticks of incense", quantity: 5}`
  (texto livre do livro, sem linha correspondente em `base_items`/`items`)
  aparecem na tela do wizard mas `InventoryItemState` exige um id de item
  válido — não há hoje um jeito de guardar "item avulso sem id" na ficha.
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
  da aba Atributos. Ressalva: itens vindos da tabela `items` (kits, sacos de
  aventureiro) aparecem na lista mas sem navegação para tela de detalhe —
  `app/sheet/item/[id].tsx` só resolve ids de `base_items`; ver item abaixo.
- **Tela de detalhe de item não cobre a tabela `items`.**
  `app/sheet/item/[id].tsx` (`getBaseItemDetailById`) só sabe buscar em
  `base_items` — itens de `items` (kits, sacos de aventureiro, instrumentos
  mágicos etc.) concedidos pelo wizard aparecem na aba Inventário como não
  clicáveis (`DisplayItem.navigable = false` em `character-inventory.tsx`)
  por não terem tela de detalhe para abrir.
- **Fontes além do PHB.** Depois que o teste no celular mostrou todas as
  raças/subraças/classes/antecedentes/magias de TODOS os sourcebooks
  misturados no wizard (sem hierarquia clara, +200 opções sem tradução),
  restringi toda consulta usada pelo wizard a `source = 'PHB'`:
  `getAllRaces`, `getAllClasses`, `getSubclassesForClass`,
  `getClassFeatures`, `getSubclassFeatures`, `classGrantsSubclassAtLevel1`,
  `classGrantsExpertiseAtLevel1`, `getAllBackgrounds`, `getAllSpells`,
  `getSpellsForClass`, `getBaseItemsByNames`, `getItemsByNames` (e
  `data/queries/character-features.ts`'s `class_features`/
  `subclass_features` internas). Quando outros sourcebooks (Xanathar's,
  Tasha's, etc.) forem traduzidos para pt-BR, tirar esse filtro (ou trocar
  por uma lista configurável de fontes habilitadas) nesses mesmos pontos.
- **Humano (Variante).** Fica de fora do wizard (`getAllRaces` exclui a raça
  `name = 'Variant'` explicitamente) até o app ter talentos implementados —
  ela dá +1/+1 em dois atributos à escolha, uma perícia à escolha e um
  talento à escolha. Quando implementar talentos: tirar o filtro
  `name != 'Variant'` de `data/queries/races.ts`, construir a tela de
  escolha (2 atributos + 1 perícia + 1 talento) e religar
  `data/wizard/assemble-character.ts`.
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
- **Ancestralidade Dracônica do Draconato modelada fora do mecanismo de
  sub-raça.** A tabela de 10 linhagens (`constants/draconic-ancestry.ts`) é
  na verdade um template `_versions`/`_implementations` do 5etools que o
  import não expande (decisão já documentada: fora de escopo). Se algum dia
  vier outra raça com esse mesmo mecanismo, vale considerar expandir o
  template genericamente no import em vez de repetir esse padrão hardcoded
  por raça.
