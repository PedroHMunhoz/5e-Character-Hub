# TODO — Fonte única de pendências do projeto

Registro central de decisões de simplificação/adiamento e pendências em
aberto, para consulta futura em vez de depender de memória de conversa.
Substitui o antigo `docs/wizard-todo.md` (conteúdo migrado abaixo, sem
perdas). Itens já resolvidos ficam marcados com `~~riscado~~` + nota,
mesmo padrão usado anteriormente — não são apagados, pois documentam o
porquê de decisões que continuam valendo.

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
veículos (terrestres + aquáticos), e 12 das 13 classes.

### Bloqueado (aguardando decisão do usuário)

- **Patrulheiro (Ranger) — classe inteira.** O texto impresso do PHB
  pt-BR parece refletir as regras de 2014 **pré-errata**:
  - Inimigo Predileto lista só 5 tipos de criatura, contra 13 tipos +
    opção de duas raças humanoides no banco (que já reflete a errata).
  - Companheiro Animal do Rastreador de Feras usa lista fixa de animais
    específicos por 50po/8h, em vez do sistema genérico por CD que a
    errata trouxe.
  - O livro imprime um 3º arquétipo, "Conclave do Rastreador Subterrâneo"
    (p.121-122), que **não existe em nenhuma fonte no banco atual** — só
    Beast Master e Hunter estão modelados como subclasses PHB do
    Patrulheiro.
  - `DUVIDAS.md` registra 3 opções em aberto: (a) usar o texto do livro
    mesmo sabendo que é pré-errata; (b) usuário obter a errata oficial
    pt-BR para conferir feature a feature; (c) deixar o Patrulheiro de
    fora do banco pt-BR por enquanto. **Não traduzir/implementar nada do
    Patrulheiro até o usuário retomar esse ponto explicitamente.**
- **"Sino" (Símbolo Sagrado) pode ser duplicata do item genérico `Bell`.**
  Ao dar nome em inglês pros itens exclusivos do pt-BR (Sinete/Sino),
  achei que existe um item genérico `Bell|PHB` (p.150, tipo `G`) com o
  mesmo preço exato do "Sino" (Símbolo Sagrado, p.151) — mesmo padrão já
  visto com Manto/Robes (uma duplicata impressa no livro). "Sino" continua
  em português por ora (não dá pra renomear pra `Bell` sem colidir com
  esse item real). Decida: (a) mesclar — apagar o "Sino" customizado e
  usar só o `Bell` genérico (perde o foco de conjuração dedicado); ou
  (b) manter distintos — decidir um nome em inglês sem colisão pro "Sino".
  Ver `DUVIDAS.md`, seção "PHB — Itens Gerais".

### Pendente (decisão de escopo/schema, não é bloqueio de conteúdo)

- **Bens de comércio e bugigangas** ("Comércio de Bens" p.159, "Bugigangas"
  d100 p.161) — não existe tabela no schema para isso ainda.
- **Conteúdo de multiclasse dos talentos** (p.165 em diante) — não existe
  entidade no banco para representar isso.
- **Sourcebooks além do PHB** (Xanathar's, Tasha's, SCAG etc.) — não
  iniciado; todo o wizard está hard-filtrado para `source = 'PHB'` até
  esses livros serem traduzidos (ver item "Fontes além do PHB" abaixo).
- **Estrutura de pacote→itens** (Artista/Assaltante/Aventureiro/Diplomata/
  Estudioso/Explorador/Sacerdote, p.153) — nome e conteúdo (prosa) já
  traduzidos (`translations/pt-BR/PHB/items.json`), mas o schema ainda não
  modela "pacote contém N de item X" como dado estruturado (o dataset em
  inglês tem isso em `packContents`, mas nada no schema/import usa esse
  campo hoje). Só importa se algum dia quisermos resolver o conteúdo do
  pacote pra itens de catálogo de verdade, em vez de só texto.
- **Arreios/acessórios de montaria** (Alforje, Armadura de Montaria,
  Estábulo, Freio e rédea, variantes de Sela — mesma seção do livro que
  montarias/veículos, p.157, mas não são tipo `MNT`/`VEH`) — não
  traduzidos ainda, ficaram de fora da rodada de montarias/veículos.

## Wizard de criação de personagem

Decisões de simplificação/adiamento tomadas durante a implementação do
wizard de criação de personagens (ver plano original em conversa com o
usuário).

- **Perícia duplicada entre antecedente, raça e classe.** O pool de escolha
  de perícias da classe remove a(s) perícia(s) já concedida(s) pelo
  antecedente e pela raça (Elfo/Meio-Orc fixas, Meio-Elfo à escolha); o pool
  de escolha racial do Meio-Elfo por sua vez remove as já concedidas por
  antecedente/raça-fixa/classe-já-escolhida. O RAW diz que, nesse caso, o
  jogador ganha um talento ou proficiência em idioma à escolha em vez da
  perícia repetida — não implementado.
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
- **Fluxo de multiclasse** (adicionar uma segunda classe depois de criado o
  personagem) — o wizard só cria o 1º nível de uma única classe.
- **Editar raça/classe/antecedente depois de criado** — decisão do
  usuário: não será permitido fazer isso; não é lacuna a implementar.
- ~~Deletar personagem~~ — **implementado**: via longpress na lista de
  Personagens.
- **Duplicar personagem** — decisão do usuário: não existirá.
- **Itens "special" do equipamento resolvido não entram no inventário
  persistido.** Entradas como `{special: "sticks of incense", quantity: 5}`
  (texto livre do livro, sem linha correspondente em `base_items`/`items`)
  aparecem na tela do wizard mas `InventoryItemState` exige um id de item
  válido — não há hoje um jeito de guardar "item avulso sem id" na ficha.
- **Quantidade de arma/armadura não aparece em lugar nenhum da UI.**
  Achado ao vivo: Guerreiro com "2x machadinhas" (equipamento inicial do
  Lutador em Duelo) — `character.inventoryItems[handaxeKey].quantity` já
  fica `'2'` corretamente (resolver + soma da explosão de pack cobrem isso),
  mas `EquipmentItemCard` (usado pelas seções `weapon`/`armor` de
  `character-inventory.tsx`) não tem prop de quantidade — só
  `StackableItemCard` (`consumable`) mostra um badge. Discutido com o
  usuário 2 abordagens, ambas adiadas por enquanto:
  1. Empilhar (1 card, badge "×2", como consumível) — mudança pequena, mas
     `weaponSlot` continua sendo 1 só por registro, então não dá pra
     equipar 1 na mão principal e outra na secundária de verdade.
  2. Itens separados (cada machadinha com seu próprio registro/weaponSlot,
     permitindo dual-wield real) — exige remodelar `inventoryItems` de
     `Record<itemId, InventoryItemState>` pra algo com múltiplas instâncias
     por item de catálogo; mexe em `types/character.ts`, no reducer de
     `context/character-context.tsx`, na tela de item e na lista do
     inventário.
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
  a tradução da classe Patrulheiro está deliberadamente bloqueada (ver
  seção "Tradução PHB (pt-BR)" acima — o texto do PHB traduzido é
  pré-errata). Implementar essa escolha exigiria traduzir justamente o
  conteúdo bloqueado, então fica de fora até a tradução do Patrulheiro ser
  retomada.
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
- **Proficiências "livres" (sem item de catálogo) nunca são persistidas na
  ficha final do personagem.** Achado ao corrigir a exibição em inglês de
  "vehicles (land)"/"vehicles (water)" (proficiência de veículo do Herói
  do Povo/Soldado/Marinheiro): `assemble-character.ts` só grava na ficha
  as entradas de proficiência `kind === 'item'` — qualquer coisa que
  resolva pra `kind: 'special'` ou `kind: 'unresolved'` (sem um id de
  catálogo pra apontar) é descartada silenciosamente. Não é um problema
  exclusivo de veículo: afeta qualquer proficiência desse formato, hoje e
  no futuro. Corrigir de verdade exigiria um novo conceito no modelo do
  personagem (algo como `freeformProficiencies`) — decisão de escopo maior
  que ficou combinada de adiar (só corrigimos a exibição em português por
  enquanto, não a persistência).
- **Quantidade de itens "special" do equipamento inicial nunca aparece pro
  jogador.** Achado ao traduzir os itens de texto livre do equipamento
  de antecedente (`EQUIPMENT_FLAVOR_TEXT_LABELS` em
  `data/wizard/equipment-resolver.ts`) — `describeEntry()`
  (`components/wizard/equipment-choice-group.tsx`) só lê `entry.text` pra
  `kind: 'special'`, nunca `entry.quantity`. Ex.: o Acólito ganha "5 sticks
  of incense" (`quantity: 5`), mas a tela sempre mostrou (mesmo antes desta
  tradução, já em inglês) só "varetas de incenso", sem o "5". Não corrigido
  agora (fora do pedido original, só tradução de texto) — se for mexer,
  o ajuste é mostrar `${quantity}x ${text}` igual já se faz pra
  `kind: 'item'` em `describeEntry()`.
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
- **Regra opcional de sobrecarga (encumbrance) não implementada.** A barra
  "Capacidade de Carga" da aba Inventário (`character-inventory.tsx`)
  implementa só a regra RAW básica do PHB: capacidade máxima = Força × 15
  lb (convertido para × 7,5 kg pela mesma regra de arredondamento usada em
  todo o resto do app, `getWeightKg`/`formatWeightKg` em
  `data/queries/base-items.ts`), sem a variante opcional de sobrecarga
  (que reduz o deslocamento em faixas de Força×5/Força×10, e tem uma
  segunda faixa de "arrastar/levantar" em Força×30). Adiado por
  simplicidade — decidir no futuro se vale a pena implementar.
