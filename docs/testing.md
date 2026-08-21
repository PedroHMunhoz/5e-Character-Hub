# Testes automatizados

## Como rodar

```
npm test          # roda a suíte inteira uma vez
npm run test:watch  # modo watch (Vitest)
```

Não precisa de emulador, navegador, ou `expo start` rodando - a suíte usa [Vitest](https://vitest.dev) puro, em Node, sem `jest-expo`/React Native Testing Library. Isso funciona porque a lógica de regras testada aqui (`data/wizard/*.ts`, `utils/*.ts`) não importa React nem React Native - só a camada de banco (`data/queries/*.ts`) é substituída por um adaptador de teste (veja abaixo).

## O que a suíte cobre hoje

### `tests/character-creation/level1-phb-matrix.test.ts` - matriz exaustiva de criação de personagem nível 1

Cobre **todas** as combinações de nível 1 do PHB: toda raça/sub-raça (incluindo Humano Variante como opção própria) × toda classe/subclasse (uma linha por subclasse quando a classe concede subclasse já no nível 1, ex. Clériga/Feiticeiro/Bruxo) × todo antecedente. Isso não é uma amostra escolhida à mão - a matriz é gerada **direto do banco** (`assets/data/dnd5e.db`) por `tests/support/level1-matrix.ts`, consultando as mesmas queries que o app usa (`getAllRaces`, `getAllClasses`/`getSubclassesForClass`/`classGrantsSubclassAtLevel1`, `getAllBackgrounds`). Se um novo livro/raça/classe for importado no futuro com PHB como source, a suíte cresce sozinha, sem precisar editar nada aqui.

Para cada combinação da matriz, o teste:

1. Monta um `WizardDraft` completo e válido via `tests/support/build-test-draft.ts` (o "auto-preenchedor" - ver estratégia abaixo).
2. Chama `assembleCharacter` (`data/wizard/assemble-character.ts`) - a mesma função que a tela "Detalhes" da wizard chama de verdade.
3. Verifica invariantes que valem para **qualquer** combinação válida de nível 1, com a regra do PHB de onde cada uma vem documentada no código do teste:
   - **Pontos de vida**: dado de vida cheio + modificador de Constituição, mínimo 1 (PHB p.12), mais os bônus conhecidos quando aplicável - Robustez do Anão da Colina (+1), Resiliência Dracônica do Feiticeiro Linhagem Dracônica (+1), talento Durão (+2, lido de volta do personagem montado, não presumido).
   - **Classe de Armadura**: como `assembleCharacter` nunca equipa nada automaticamente, um personagem recém-criado sempre usa a fórmula "sem armadura" - base 10 + Destreza para a maioria, ou Defesa sem Armadura (Bárbaro/Monge, PHB p.46/78) / Resiliência Dracônica (Feiticeiro Linhagem Dracônica, PHB p.101) quando a classe/subclasse concede uma. O teste deriva o valor base esperado de forma independente (fórmula própria por classe) e compara com `utils/armor-class.ts`'s `getArmorClassBreakdown`/`getUnarmoredDefenseRule` - as mesmas funções que a ficha do personagem usa para exibir a CA, também com teste direto próprio (`tests/utils/armor-class.test.ts`).
   - **Proficiência em salvaguardas**: exatamente as da classe, mais Resiliente (PHB p.170) quando esse foi o talento escolhido.
   - **Referência**: raça/sub-raça/classe/subclasse/antecedente escolhidos realmente aparecem no personagem montado.
   - **Atributos**: todo total de atributo é um número plausível (o auto-preenchedor sempre usa o array padrão 15/14/13/12/10/8 + bônus racial/de talento).

### `tests/utils/*.test.ts` e o restante de `tests/wizard/*.test.ts` - regras de jogo extraídas para funções puras

Cobre mecânicas do PHB que ou já eram funções puras mas nunca tinham teste dedicado, ou só existiam inline dentro de componentes `.tsx` (React/RN, fora do alcance do Vitest node-only) e precisaram ser extraídas primeiro. Duas rodadas:

1. **Automações de equipamento (2026-08-20/21)** - `utils/armor-class.ts` (`getArmorClassBreakdown`, `getUnarmoredDefenseRule`), `utils/speed.ts` (conversões pé/metro, penalidade de velocidade por Força insuficiente, `getEffectiveSpeed`), `utils/weapon-combat.ts` (`getWeaponAttackAndDamage` - dado de dano versátil, Estilos de Luta, e a exigência de propriedade Leve nas duas mãos para o Estilo Combate com Duas Armas, PHB p.195), `utils/monk-weapons.ts` (`isMonkWeapon`), `utils/equip-slots.ts` (bloqueio de mãos ocupadas, conflito de escudo × arma de duas mãos). As três últimas foram extraídas de `context/character-context.tsx`/`app/sheet/[characterId]/item/[id].tsx` especificamente para virarem testáveis, sem mudar comportamento visível.
2. **Varredura geral de mecânicas sem teste (2026-08-21)** - `utils/ability-modifier.ts`, `utils/proficiency.ts`, `utils/spellcasting.ts`, `utils/dice.ts` (já eram puras, só faltava o teste), mais `utils/feat-bonuses.ts` (bônus dos talentos Observador/Alerta), `utils/carrying-capacity.ts` (capacidade de carga), `utils/hit-points.ts` (aplicar dano/cura, incluindo a regra de Morte por Dano Maciço) - extraídas de `passive-scores.tsx`/`character-sheet.tsx`/`character-inventory.tsx`/`manage-hp-modal.tsx` pelo mesmo motivo. `tests/wizard/{race-ability-bonus,feat-ability-bonus,feat-prerequisites,skill-proficiency-resolver}.test.ts` cobrem o lado `data/wizard/` da mesma varredura (só precisavam do teste, não de extração).

Fora essas duas rodadas, a Loja de equipamento (`tests/wizard/{item-purchase,shop-catalog,gold-purchase-assembly}.test.ts`, `tests/utils/currency.test.ts`) e o truque à escolha do Elfo Alto (`tests/character-creation/high-elf-cantrip.test.ts`) já tinham teste próprio de quando foram implementados - ver `docs/TODO.md` para o histórico de cada um.

Ver `docs/TODO.md` (seção "Testes automatizados") para a lista de lacunas de regra encontradas nessas duas rodadas que não tinham como virar um simples teste - foram pro board Trello em vez disso.

### `tests/wizard/step-validation.test.ts` - regras de "posso avançar" da wizard

Testa `data/wizard/step-validation.ts`, que extrai as regras de contagem/gate que antes viviam só dentro do `canProceed` de `app/wizard/index.tsx` (Raça) e `app/wizard/class.tsx` (Classe) - agora são funções puras, sem React, chamadas de volta pelas próprias telas (o comportamento da UI não mudou). As telas de Antecedente/Equipamento não foram extraídas: seus gates dependem de estado local por índice (`toolCategoryChoices`, `selectedOptionKeys`) que exigiria uma mudança estrutural maior para isolar - ver comentário no topo de `step-validation.ts`.

### `tests/support/sqlite-adapter.smoke.test.ts` - checagem de infraestrutura

Confirma que o adaptador SQLite de teste (abaixo) consegue abrir o banco bundlado e rodar uma query real da camada `data/queries/*` sem erro. Serve de sinal rápido se algo na infraestrutura de teste quebrar, sem precisar rodar a suíte inteira para descobrir.

## Como funciona (infraestrutura)

### O adaptador SQLite (`tests/support/sqlite-adapter.ts`)

`data/queries/*.ts` e `data/wizard/*.ts` recebem um `SQLiteDatabase` (tipo do `expo-sqlite`) como parâmetro - em produção isso vem do `SQLiteProvider`/`useSQLiteContext()` do Expo. Em teste, `openReferenceDb()` implementa só os dois métodos que a camada de dados realmente chama contra o banco de referência (`getAllAsync`/`getFirstAsync`) por cima do `node:sqlite` (`DatabaseSync`) - built-in do Node, sem dependência nativa extra - apontado para `assets/data/dnd5e.db` em modo somente-leitura. Isso permite rodar a mesma camada de queries do app, sem alterações, direto em Node.

### O auto-preenchedor de `WizardDraft` (`tests/support/build-test-draft.ts`)

Dado `raceId`/`subraceId`/`classId`/`subclassId`/`backgroundId`, produz um `WizardDraft` totalmente resolvido, sem interação humana, reaproveitando os mesmos resolvers que a wizard de verdade usa (`equipment-resolver.ts`, `tool-proficiency-resolver.ts`, `skill-proficiency-resolver.ts`, etc.) - a única coisa que este módulo decide sozinho é **qual** opção escolher quando a regra do PHB permite mais de uma.

**Estratégia: sempre a primeira opção válida, de forma determinística.** Não é sobre aleatoriedade nem sobre cobrir toda combinação de sub-escolhas (isso multiplicaria a matriz sem necessidade) - é sobre ter, para cada combinação de raça×classe×subclasse×antecedente, pelo menos um draft legítimo que `assembleCharacter` aceite. Por exemplo: método de atributo sempre "array padrão" (nunca rolagem, para não depender de RNG), sempre o primeiro talento elegível quando um é exigido (Humano Variante), sempre a primeira magia/perícia/ferramenta disponível dentro do limite da regra, sempre `equipmentMode: 'starting'`.

### A matriz (`tests/support/level1-matrix.ts`)

Gera a lista exaustiva de combinações direto do banco (ver seção acima) - não há lista fixa em lugar nenhum do código.

## Estendendo a suíte

- **Novo dado no banco** (raça, classe, subclasse, antecedente PHB): a matriz cresce sozinha, nada a fazer aqui.
- **Nova escolha aberta na wizard** (um novo tipo de "choose" que o auto-preenchedor ainda não sabe resolver): `buildTestDraft` vai lançar um erro claro (`build-test-draft: ...`) identificando o que faltou resolver - adicione a resolução ali, no mesmo padrão das existentes (sempre a primeira opção válida).
- **Nova invariante de regra a testar**: adicione ao bloco de asserções dentro do `it.each` de `level1-phb-matrix.test.ts`, com um comentário citando a página/regra do PHB de onde o valor esperado vem - nunca copie o que o código já retorna sem verificar contra o livro primeiro.

## O que a suíte NÃO cobre (fase 2, futura)

Testes de backend garantem que o **dado** do personagem está certo, mas não pegam bugs onde o dado está certo e a **tela** mostra algo errado (campo trocado, label errada, opção que deveria aparecer na wizard e não aparece). Cobrir isso é uma fase futura, com testes de componente (`jest-expo` + `@testing-library/react-native`) - ver a análise que motivou esta suíte para o raciocínio completo por trás dessa priorização.

## Bug real encontrado (e corrigido) por esta suíte

Na primeira execução da matriz inteira, 273 combinações falharam - todas envolvendo **Humano sem sub-raça** (raça base "Humano", não "Humano Variante"), em toda classe × antecedente (21 × 13 = 273). A causa: `assembleCharacter` (`data/wizard/assemble-character.ts`, bloco `missingChoices`) reconsultava `getAllRaces` e marcava "sub-raça" como pendente sempre que existia **qualquer** linha com `parentRaceId` igual à raça escolhida - incluindo a linha "Variant", que `app/wizard/index.tsx` já excluía da lista de sub-raças reais (`race.englishName !== 'Variant'`). Resultado: um jogador que escolhia Humano comum (não Variante) completava a wizard inteira normalmente (a UI nunca pedia uma sub-raça, porque `subraces.length === 0` depois desse filtro), mas ao confirmar na tela "Detalhes" a montagem final falhava com `"escolhas pendentes no wizard: sub-raça"` - travando a criação da raça mais básica do PHB. Corrigido em `assemble-character.ts` excluindo `englishName === 'Variant'` da checagem, igual ao que a Raça step já fazia. A suíte inteira (4111 casos) passa depois do fix.
