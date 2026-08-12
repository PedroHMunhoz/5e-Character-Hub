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
- **CD de Magia/Bônus de Ataque/Preparadas na aba Magias só mostram
  valores reais para classes em `SPELLCASTING_RULES`**
  (`constants/spellcasting.ts`: Bardo/Clérigo/Druida/Feiticeiro/Bruxo/
  Mago). Paladino e Patrulheiro (meio-conjuradores, `caster_progression =
  '1/2'`) sempre mostram "—", mesmo que a partir do nível 2 eles tenham
  magias reais pelo livro — a tabela de regras não os inclui (não têm
  truques/magias no nível 1, e o wizard já pula a etapa de seleção de
  magias pra eles, `app/wizard/spells.tsx`) e não há UI de progressão de
  nível no app ainda (`components/character/class-levels.tsx` é somente
  leitura), então isso é hoje inatingível na prática. Quando o app
  ganhar level-up, vale expandir `SPELLCASTING_RULES` (ou um mecanismo
  equivalente) pra cobrir a progressão de magias conhecidas dos
  meio-conjuradores.
- **Magias sempre-preparadas de subclasse (`subclasses.additional_spells`)
  só cobrem o caso sem escolha adicional.** O import
  (`scripts/import-5e-data.mjs`) só extrai `additionalSpells[].prepared`
  quando há exatamente uma entrada sem campo `name` — cobre os 7 Domínios
  do Clérigo do PHB core e Círculo dos Esporos/Fogo Selvagem do Druida.
  Ficam de fora (coluna fica `null`): **Círculo da Terra** do Druida (o
  `additionalSpells` bruto é um array com 8 sub-opções nomeadas, uma por
  bioma — precisaria de um passo de escolha "qual bioma" que não existe
  no wizard nem no modelo de dados do personagem) e os **Patronos do
  Bruxo** (Arquifada, Corruptor, Grande Antigo etc. — usam a chave
  `expanded`, não `prepared`: é uma lista extra de magias que podem ser
  *escolhidas* como conhecidas, não uma concessão automática de "sempre
  preparada", mecanismo diferente do que `getSubclassAdditionalSpellsByLevel`
  resolve hoje).
- **Ancestralidade Dracônica do Draconato modelada fora do mecanismo de
  sub-raça.** A tabela de 10 linhagens (`constants/draconic-ancestry.ts`) é
  na verdade um template `_versions`/`_implementations` do 5etools que o
  import não expande (decisão já documentada: fora de escopo). Se algum dia
  vier outra raça com esse mesmo mecanismo, vale considerar expandir o
  template genericamente no import em vez de repetir esse padrão hardcoded
  por raça.
- **Inimigo Predileto/Explorador Nato do Patrulheiro (1º nível) fora do
  wizard.** O Patrulheiro tem duas escolhas obrigatórias de 1º nível, iguais
  em espírito ao Estilo de Luta do Guerreiro/Domínio Divino do Clérigo, mas
  a tradução da classe Patrulheiro está deliberadamente bloqueada
  (`[[project_pt-br-translation]]`/`translations/pt-BR/DUVIDAS.md` — o texto
  do PHB traduzido é pré-errata). Implementar essa escolha exigiria traduzir
  justamente o conteúdo bloqueado, então fica de fora até a tradução do
  Patrulheiro ser retomada.
- **Estilo de Luta do Paladino/Patrulheiro no 2º nível.** Ambos ganham a
  mesma escolha de Estilo de Luta do Guerreiro (implementada em
  `app/wizard/class.tsx`/`data/queries/optional-features.ts`/
  `utils/armor-class.ts`), só que no 2º nível em vez do 1º — fora de escopo
  hoje porque o wizard só cria personagens de nível 1. Quando o app ganhar
  level-up, reaproveitar o mecanismo inteiro (mesma tabela
  `optional_features`, mesmo componente de escolha+descrição, mesma
  aplicação de bônus) em vez de reconstruir algo novo.
- **Ataque Furtivo do Ladino não aparece somado no Acerto/Dano da arma.** A
  característica (`app/sheet/[characterId]/feature/[id].tsx`) já traz a
  progressão completa por nível no texto, mas a tela de detalhe de arma
  (`app/sheet/[characterId]/item/[id].tsx`) não soma esse dano extra em
  lugar nenhum — o jogador precisa calcular de cabeça. Daria pra mostrar
  o dano extra (ou uma nota separada) no campo "Dano" quando o personagem
  for Ladino, usando o nível dele pra calcular o número de d6
  (`Math.ceil(nível / 2)`), condicionado à arma ser de acuidade ou à
  distância. Não implementado ainda porque é condicionado por vantagem no
  ataque (não um bônus estático como os Estilos de Luta/Defesa sem
  Armadura), então precisa de decisão de design sobre como representar isso
  numa ficha sem simulador de rolagem de dados.
- **Levantamento de bônus passivos de classe (CA/PV/acerto/dano) restrito
  ao PHB, nível 1-2.** `utils/armor-class.ts`'s `UnarmoredDefenseRule` cobre
  Defesa sem Armadura (Bárbaro/Monge) e Resiliência Dracônica (Feiticeiro),
  e `utils/monk-weapons.ts`/`isMonkWeapon` cobre Artes Marciais do Monge —
  nenhuma outra característica de classe/subclasse do PHB em nível 1-2 tem
  esse tipo de bônus numérico sempre-ativo (levantamento completo feito ao
  implementar essas mudanças). Se o app ganhar outros sourcebooks
  (Xanathar's, Tasha's) ou level-up, vale refazer esse levantamento para as
  classes/features/níveis que entrarem.
