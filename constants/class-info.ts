// Descrição resumida + atributos principais de cada classe do PHB, pra exibir no wizard
// assim que o jogador seleciona a classe (app/wizard/class.tsx). Nenhum dos dois existe no
// dataset importado (db/schema.sql's `classes` não tem coluna de descrição narrativa nem de
// "atributo principal" - savingThrowProficiencies não é um substituto confiável, ex.
// Guerreiro salva em Força/Constituição mas seu atributo principal é Força ou Destreza), então
// isso é conteúdo novo escrito à mão, mesmo padrão de constants/favored-enemy.ts.
//
// Chaveado pelo nome em inglês da classe (não por `id`, reatribuído a cada
// `npm run db:import` - ver Race.englishName em types/reference.ts -, nem pelo nome
// localizado, que muda com a tradução), obtido via getClassEnglishName
// (data/queries/classes.ts), mesmo padrão de constants/spellcasting.ts's SPELLCASTING_RULES.
//
// description.pt-BR é um resumo autoral (não uma citação do PHB) da abertura de cada classe
// (vinhetas + parágrafo definidor + subseções, até "Criando um X"), escrito pra ser
// compreensível por quem nunca jogou D&D. description.en é minha própria adaptação do mesmo
// resumo, não uma tradução literal do texto em inglês do PHB - o app é pt-BR only hoje (sem
// seletor de idioma em runtime), mas o campo já existe bilíngue pra não exigir retrabalho
// futuro.
//
// primaryAbility/secondaryAbility vêm da seção "CONSTRUÇÃO RÁPIDA" (Quick Build) de cada
// classe no PHB (translations/pt-BR/_raw-extracts/PHB.txt, mesmas páginas de
// description) - ex. Bardo: "coloque seu valor de habilidade mais alto em Carisma, seguido
// de Destreza"; Guerreiro: "em Força ou Destreza, a depender de se você quer se focar em
// armas corpo-a-corpo ou em arquearia". A maioria das classes tem uma habilidade definida
// por slot, mas Guerreiro (principal), Clérigo, Ladino e Mago (secundária) têm alternativas
// reais - qual escolher depende de estilo de jogo ou de uma escolha ainda não feita no
// wizard (ex. Domínio Divino do Clérigo, que É escolhido neste mesmo passo) - daí o `note`
// por opção. Detalhes condicionados a uma subclasse escolhida só depois do nível 1 (Cavaleiro
// Arcano do Guerreiro, Escola de Encantamento do Mago) foram propositalmente deixados de
// fora por ainda não serem uma decisão que o jogador tomou neste ponto do wizard.
import { ABILITIES } from './character';
import type { AbilityKey } from '@/types/character';

export interface LocalizedText {
  'pt-BR': string;
  en: string;
}

export interface AbilityOption {
  key: AbilityKey;
  // Nota curta explicando a diferença entre as opções - só presente quando o
  // slot tem 2+ alternativas reais (ex. Força "combate corpo a corpo" vs
  // Destreza "combate à distância" no Guerreiro).
  note?: LocalizedText;
}

// Formata um slot de prioridade (primaryAbility ou secondaryAbility) como
// texto pt-BR, ex. "Carisma" ou "Força (combate corpo a corpo) ou Destreza
// (combate à distância)" - usado tanto no card de descrição da classe
// (app/wizard/class.tsx) quanto na dica de distribuição de atributos
// (app/wizard/abilities.tsx).
export function formatAbilitySlot(options: AbilityOption[]): string {
  return options
    .map((option) => {
      const label = ABILITIES.find((a) => a.key === option.key)?.label ?? option.key;
      return option.note ? `${label} (${option.note['pt-BR']})` : label;
    })
    .join(' ou ');
}

export interface ClassInfo {
  description: LocalizedText;
  // Prioridade de atributos da "Construção Rápida" do PHB: primaryAbility vai
  // no valor mais alto, secondaryAbility no segundo mais alto. Um slot com 2+
  // opções é uma alternativa genuína ("ou", não "precisa dos dois").
  primaryAbility: AbilityOption[];
  secondaryAbility: AbilityOption[];
}

export const CLASS_INFO: Record<string, ClassInfo> = {
  Barbarian: {
    description: {
      'pt-BR':
        'Bárbaros canalizam uma fúria primitiva que os deixa quase imparáveis em combate, ganhando força e resistência sobre-humanas enquanto ela dura. Vêm de povos que vivem à margem da civilização, desconfortáveis entre muralhas e multidões, e tratam o perigo do mundo selvagem como algo natural, não uma ameaça a evitar. Em batalha, preferem golpes diretos e brutais a estratégias refinadas, suportando o que quer que o campo de batalha jogar contra eles.',
      en: 'Barbarians channel a primal fury that makes them nearly unstoppable in combat, gaining superhuman strength and resilience while it lasts. They come from peoples who live at the edge of civilization, uncomfortable within walls and crowds, and treat the dangers of the wild as something natural rather than a threat to avoid. In battle, they favor direct, brutal blows over refined strategy, enduring whatever the battlefield throws at them.',
    },
    primaryAbility: [{ key: 'str' }],
    secondaryAbility: [{ key: 'con' }],
  },
  Bard: {
    description: {
      'pt-BR':
        'Bardos usam palavras e música como uma forma genuína de magia, capaz de inspirar aliados, enganar inimigos, criar ilusões e até curar ferimentos. Diferente de magos e clérigos, aprendem sua arte estudando um pouco de tudo — história, música, encantamento —, o que os torna extremamente versáteis dentro e fora de combate. São contadores de histórias natos, sempre em busca de novas aventuras para transformar em canções.',
      en: 'Bards use words and music as a genuine form of magic, able to inspire allies, deceive enemies, create illusions, and even heal wounds. Unlike wizards and clerics, they learn their craft by studying a bit of everything — history, music, enchantment — which makes them extremely versatile both in and out of combat. They are natural storytellers, always chasing new adventures to turn into songs.',
    },
    primaryAbility: [{ key: 'cha' }],
    secondaryAbility: [{ key: 'dex' }],
  },
  Cleric: {
    description: {
      'pt-BR':
        'Clérigos canalizam o poder divino de uma divindade, servindo como ponte entre o mundo mortal e os deuses. Combinam magias de cura e proteção com a capacidade de ferir e debilitar inimigos, e ainda se saem bem em combate corpo a corpo quando preciso. Aventuram-se a mando de sua fé, cumprindo missões sagradas, defendendo seus templos e devotos, ou levando a vontade de seu deus a lugares distantes.',
      en: "Clerics channel the divine power of a deity, serving as a bridge between the mortal world and the gods. They combine healing and protective magic with the ability to harm and weaken enemies, and still hold their own in melee combat when needed. They adventure at the call of their faith, carrying out sacred missions, defending their temples and worshippers, or spreading their god's will to distant lands.",
    },
    primaryAbility: [{ key: 'wis' }],
    secondaryAbility: [
      { key: 'str', note: { 'pt-BR': 'Domínios mais voltados a combate', en: 'more combat-focused Domains' } },
      { key: 'con', note: { 'pt-BR': 'resistência geral, nos demais Domínios', en: 'general durability, other Domains' } },
    ],
  },
  Druid: {
    description: {
      'pt-BR':
        'Druidas extraem seu poder diretamente da natureza, seja da força selvagem do mundo em si ou de uma divindade natural que servem. Lançam magias ligadas aos elementos e aos animais, e sua marca registrada é a capacidade de se transformar em criaturas selvagens. Veem a si mesmos como guardiões do equilíbrio natural, entrando em ação sempre que esse equilíbrio é ameaçado por monstros ou pela própria civilização.',
      en: 'Druids draw their power directly from nature, whether from the wild force of the world itself or from a nature deity they serve. They cast spells tied to the elements and animals, and their signature ability is shapeshifting into wild creatures. They see themselves as guardians of the natural balance, stepping in whenever that balance is threatened by monsters or by civilization itself.',
    },
    primaryAbility: [{ key: 'wis' }],
    secondaryAbility: [{ key: 'con' }],
  },
  Fighter: {
    description: {
      'pt-BR':
        'Guerreiros são mestres de armas e armaduras, capazes de mais estilos e opções de combate do que qualquer outra classe. Não dependem de magia: seu poder vem de treinamento intenso, disciplina e uma ampla variedade de táticas, seja lutando corpo a corpo, à distância ou lado a lado com aliados. É uma classe direta e extremamente versátil, tanto para quem quer simplicidade quanto para quem quer se aprofundar em um estilo de combate específico.',
      en: "Fighters are masters of weapons and armor, capable of more fighting styles and combat options than any other class. They rely on no magic: their power comes from intense training, discipline, and a wide range of tactics, whether fighting in melee, at range, or alongside allies. It's a straightforward, extremely versatile class, suited both to players who want simplicity and to those who want to master one specific fighting style.",
    },
    primaryAbility: [
      { key: 'str', note: { 'pt-BR': 'combate corpo a corpo', en: 'melee combat' } },
      { key: 'dex', note: { 'pt-BR': 'combate à distância', en: 'ranged combat' } },
    ],
    secondaryAbility: [{ key: 'con' }],
  },
  Monk: {
    description: {
      'pt-BR':
        'Monges canalizam uma energia mística chamada chi, fruto de anos de treinamento físico e espiritual rigoroso em mosteiros isolados. Sem depender de armas ou armaduras, transformam o próprio corpo em uma arma ágil e poderosa, unindo velocidade, precisão e disciplina em cada golpe. Costumam deixar a vida monástica para testar, no mundo, tudo o que aprenderam sobre autoaperfeiçoamento.',
      en: "Monks channel a mystical energy called ki, the product of years of rigorous physical and spiritual training in isolated monasteries. Without relying on weapons or armor, they turn their own bodies into agile, powerful weapons, blending speed, precision, and discipline into every strike. They often leave monastic life to test everything they've learned about self-mastery out in the world.",
    },
    primaryAbility: [{ key: 'dex' }],
    secondaryAbility: [{ key: 'wis' }],
  },
  Paladin: {
    description: {
      'pt-BR':
        'Paladinos são guerreiros ligados por um juramento sagrado de combater o mal e defender a justiça, o que lhes concede poder divino além de sua habilidade marcial. Unem uma excelente capacidade de combate corpo a corpo a magias de cura e proteção, sendo tão fortes defendendo os aliados quanto atacando os inimigos. É a natureza desse juramento — o que exatamente jurou defender — que mais define quem são como aventureiros.',
      en: 'Paladins are warriors bound by a sacred oath to fight evil and defend justice, which grants them divine power alongside their martial skill. They pair excellent melee combat with healing and protective magic, making them as strong defending allies as they are attacking enemies. The nature of that oath — exactly what they swore to defend — is what most defines who they are as adventurers.',
    },
    primaryAbility: [{ key: 'str' }],
    secondaryAbility: [{ key: 'cha' }],
  },
  Ranger: {
    description: {
      'pt-BR':
        'Patrulheiros são guerreiros da natureza, especializados em caçar as ameaças que rondam as fronteiras da civilização, como monstros, gigantes e dragões. Combinam habilidades de combate com magias ligadas à natureza, além de talentos de rastreamento e sobrevivência que tornam qualquer ambiente selvagem seu território. Escolhem um inimigo favorito e um terreno de especialidade, afiando suas técnicas contra ameaças específicas.',
      en: 'Rangers are warriors of the wild, specialized in hunting the threats that prowl the edges of civilization, such as monsters, giants, and dragons. They combine combat skill with nature-based magic, plus tracking and survival talents that make any wilderness their territory. They choose a favored enemy and a favored terrain, honing their techniques against specific threats.',
    },
    primaryAbility: [{ key: 'dex' }],
    secondaryAbility: [{ key: 'wis' }],
  },
  Rogue: {
    description: {
      'pt-BR':
        'Ladinos contam com perícia, furtividade e a exploração das fraquezas do inimigo para vencer qualquer situação, em vez de força bruta. Dominam perícias como verdadeiros especialistas, abrindo fechaduras, desarmando armadilhas e se infiltrando onde ninguém mais consegue, e em combate preferem um único golpe preciso e devastador a uma sequência de ataques. Vivem entre a lei e o crime, e sua versatilidade os torna indispensáveis em qualquer grupo de aventureiros.',
      en: "Rogues rely on skill, stealth, and exploiting an enemy's weaknesses to gain the upper hand in any situation, rather than brute force. They master skills like true specialists, picking locks, disarming traps, and sneaking in where no one else can, and in combat they prefer one precise, devastating strike over a flurry of attacks. They live on both sides of the law, and their versatility makes them indispensable to any adventuring party.",
    },
    primaryAbility: [{ key: 'dex' }],
    secondaryAbility: [
      { key: 'int', note: { 'pt-BR': 'perícia e investigação', en: 'skill checks & investigation' } },
      { key: 'cha', note: { 'pt-BR': 'enganação e interação social', en: 'deception & social interaction' } },
    ],
  },
  Sorcerer: {
    description: {
      'pt-BR':
        'Feiticeiros nascem com magia correndo nas próprias veias, herdada de uma linhagem exótica — sangue de dragão, contato com forças cósmicas ou algum evento extraordinário — em vez de aprendida em livros. Não controlam sua magia com a precisão de um mago, mas compensam isso com uma flexibilidade única, ajustando suas magias na hora ao gastar pontos de feitiçaria. Muitos passam a vida tentando entender ou dominar de vez o poder que carregam.',
      en: "Sorcerers are born with magic running through their veins, inherited from an exotic bloodline — draconic blood, contact with cosmic forces, or some extraordinary event — rather than learned from books. They don't control their magic with a wizard's precision, but make up for it with unique flexibility, shaping their spells on the fly by spending sorcery points. Many spend their lives trying to understand, or fully master, the power they carry.",
    },
    primaryAbility: [{ key: 'cha' }],
    secondaryAbility: [{ key: 'con' }],
  },
  Warlock: {
    description: {
      'pt-BR':
        'Bruxos obtêm seu poder mágico não através de estudo, mas de um pacto firmado com uma entidade sobrenatural — uma fada, um demônio, um ser alienígena — em troca de serviços ocasionais. Esse acordo concede efeitos mágicos poderosos e um pequeno número de magias muito versáteis, complementadas por invocações místicas exclusivas. Vivem movidos por uma sede insaciável de conhecimento e poder, cientes de que devem algo a um ser muito maior que eles.',
      en: 'Warlocks gain their magical power not through study, but through a pact struck with a supernatural entity — a fey, a fiend, an alien being — in exchange for occasional favors. That bargain grants powerful magical effects and a small number of highly versatile spells, backed up by unique eldritch invocations. They live driven by an insatiable hunger for knowledge and power, aware that they owe something to a being far greater than themselves.',
    },
    primaryAbility: [{ key: 'cha' }],
    secondaryAbility: [{ key: 'con' }],
  },
  Wizard: {
    description: {
      'pt-BR':
        'Magos aprendem magia através de estudo intenso, disciplina e um grimório pessoal onde registram tudo o que descobrem. Têm acesso à maior variedade de magias entre todas as classes, cobrindo praticamente qualquer situação — de bolas de fogo devastadoras a ilusões, adivinhação e portais entre mundos. São movidos por uma sede insaciável de conhecimento arcano, sempre em busca de segredos perdidos de civilizações antigas.',
      en: "Wizards learn magic through intense study, discipline, and a personal spellbook where they record everything they discover. They have access to the widest variety of spells of any class, covering nearly any situation — from devastating fireballs to illusions, divination, and portals between worlds. They're driven by an insatiable thirst for arcane knowledge, always searching for secrets lost by ancient civilizations.",
    },
    primaryAbility: [{ key: 'int' }],
    secondaryAbility: [
      { key: 'con', note: { 'pt-BR': 'resistência', en: 'durability' } },
      { key: 'dex', note: { 'pt-BR': 'defesa e iniciativa', en: 'defense & initiative' } },
    ],
  },
};
