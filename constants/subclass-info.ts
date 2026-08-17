// Flavor text resumido pras subclasses escolhidas no 1° nível (mesmo passo do wizard em
// que a classe é escolhida, app/wizard/class.tsx): Domínio Divino do Clérigo, Origem de
// Feitiçaria do Feiticeiro e Patrono Transcendental do Bruxo - as únicas 3 classes do PHB
// em que classGrantsSubclassAtLevel1 (data/queries/classes.ts) retorna true. Mesmo padrão
// de constants/class-info.ts: nenhuma dessas subclasses tem descrição narrativa no dataset
// importado (db/schema.sql's `subclasses` só tem name/short_name/source/srd), então isso é
// conteúdo novo, resumido a partir da abertura de cada domínio/origem/patrono no PHB
// (translations/pt-BR/_raw-extracts/PHB.txt, mesmas páginas do capítulo da classe), escrito
// com minhas próprias palavras e bilíngue, igual às descrições de classe.
//
// Chaveado por [nome em inglês da classe][shortName da subclasse] - shortName é o
// identificador cru e estável usado pelo próprio projeto pra isso (ver
// scripts/import-translations.mjs's resolveSubclassId e
// data/wizard/assemble-character.ts:289's `subclass?.shortName === 'Draconic'`), ao
// contrário de `id` (reatribuído a cada `npm run db:import`) e do nome localizado (muda com
// a tradução).
import type { LocalizedText } from './class-info';

export const SUBCLASS_INFO: Record<string, Record<string, LocalizedText>> = {
  Cleric: {
    Knowledge: {
      'pt-BR':
        'Domínio do Conhecimento reúne clérigos devotados a deuses do saber, do estudo e do ofício, que buscam acumular e proteger conhecimento. Na prática, ganham perícias e magias voltadas a identificar, lembrar e explicar quase qualquer coisa, funcionando como o sábio do grupo.',
      en: "The Knowledge Domain gathers clerics devoted to gods of learning, study, and craft, who strive to collect and safeguard knowledge. In practice, they gain skills and spells for identifying, recalling, and explaining almost anything, acting as the party's scholar.",
    },
    Life: {
      'pt-BR':
        'Domínio da Vida reúne clérigos focados em cura, vitalidade e proteção contra a morte e os mortos-vivos, servindo deuses da saúde e da comunidade. Na prática, é a escolha mais forte em cura pura, mantendo o grupo de pé em qualquer combate.',
      en: "The Life Domain gathers clerics focused on healing, vitality, and warding off death and undeath, serving gods of health and community. In practice, it's the strongest healing option in the game, keeping the party standing through any fight.",
    },
    Light: {
      'pt-BR':
        'Domínio da Luz reúne clérigos de deuses solares, ligados à verdade, à vigilância e à revelação do que está escondido. Na prática, ganham magias de fogo e luz que enxergam através de ilusões e enganos e queimam inimigos à distância.',
      en: "The Light Domain gathers clerics of solar deities, tied to truth, vigilance, and revealing what's hidden. In practice, they gain fire and light spells that see through illusion and deception and strike enemies from afar.",
    },
    Nature: {
      'pt-BR':
        'Domínio da Natureza reúne clérigos de deuses ligados às florestas, aos animais e ao mundo selvagem, muitas vezes atuando como protetores ativos da natureza. Na prática, combinam magias de druida com as de clérigo, além de afinidade com criaturas selvagens.',
      en: 'The Nature Domain gathers clerics of gods tied to forests, animals, and the wild, often acting as active protectors of nature. In practice, they blend druid-style spells with cleric magic, plus an affinity with wild creatures.',
    },
    Tempest: {
      'pt-BR':
        'Domínio da Tempestade reúne clérigos de deuses dos mares, tempestades e relâmpagos, que espalham temor e justiça rápida como uma força da natureza. Na prática, ganham magias e ataques elétricos e sônicos, ótimos para golpear inimigos à distância.',
      en: 'The Tempest Domain gathers clerics of gods of seas, storms, and lightning, who spread awe and swift justice like a force of nature. In practice, they gain lightning and thunder spells and attacks, great for striking enemies at range.',
    },
    Trickery: {
      'pt-BR':
        'Domínio da Enganação reúne clérigos de deuses trapaceiros e desafiadores da ordem, protetores de ladrões, rebeldes e oprimidos. Na prática, ganham truques de furtividade e ilusão, preferindo o subterfúgio ao confronto direto.',
      en: 'The Trickery Domain gathers clerics of mischievous, order-defying gods, patrons of thieves, rebels, and the oppressed. In practice, they gain stealth and illusion tricks, favoring subterfuge over direct confrontation.',
    },
    War: {
      'pt-BR':
        'Domínio da Guerra reúne clérigos de deuses ligados ao combate, à honra ou à conquista, que zelam pelos guerreiros e recompensam seus feitos. Na prática, são clérigos com forte capacidade de combate corpo a corpo, quase tão eficazes em batalha quanto um guerreiro.',
      en: "The War Domain gathers clerics of gods tied to combat, honor, or conquest, who watch over warriors and reward their deeds. In practice, they're clerics with strong melee combat ability, nearly as effective in battle as a fighter.",
    },
  },
  Sorcerer: {
    Draconic: {
      'pt-BR':
        'Linhagem Dracônica vem de sangue de dragão em algum ponto da ascendência do feiticeiro, seja por pacto antigo ou parentesco direto com um dragão. Na prática, concede resistência a dano e uma pele com aparência dracônica, além de bônus ligados ao tipo de dragão escolhido.',
      en: "Draconic Bloodline comes from dragon blood somewhere in the sorcerer's ancestry, whether through an ancient pact or direct kinship with a dragon. In practice, it grants damage resistance and dragon-like skin, plus bonuses tied to the chosen dragon type.",
    },
    Wild: {
      'pt-BR':
        'Magia Selvagem vem de uma exposição bruta a forças caóticas — um portal planar, a bênção de uma fada ou pura casualidade de nascimento — sem uma origem clara. Na prática, seus feitiços podem, ocasionalmente, disparar efeitos mágicos aleatórios e imprevisíveis, tornando cada combate uma incógnita.',
      en: "Wild Magic comes from raw exposure to chaotic forces — a planar portal, a fey's blessing, or pure chance at birth — with no clear origin. In practice, your spells can occasionally trigger random, unpredictable magical effects, making every fight a wildcard.",
    },
  },
  Warlock: {
    Archfey: {
      'pt-BR':
        'Arquifada é um senhor ou senhora das fadas, um ser antigo, poderoso e imprevisível do Plano Feérico com motivações difíceis de entender. Na prática, o patrono oferece magias ligadas a encantamento e ilusão, reforçando o lado sedutor e enganoso do bruxo.',
      en: "The Archfey is a lord or lady of the fey, an ancient, powerful, and unpredictable being from the Feywild whose motives are hard to grasp. In practice, this patron grants enchantment and illusion spells, reinforcing the warlock's seductive, deceptive side.",
    },
    Fiend: {
      'pt-BR':
        'Corruptor é uma entidade maligna vinda dos planos inferiores — um demônio, diabo ou senhor das profundezas — cujo objetivo final é corromper ou destruir tudo, inclusive o próprio bruxo. Na prática, o patrono oferece magias de fogo e destruição, reforçando o lado ofensivo e sombrio do bruxo.',
      en: "The Fiend is an evil entity from the lower planes — a demon, devil, or other dark lord — whose ultimate goal is to corrupt or destroy everything, including the warlock. In practice, this patron grants fire and destruction spells, reinforcing the warlock's offensive, dark side.",
    },
    'Great Old One': {
      'pt-BR':
        'Grande Antigo é uma entidade alienígena e incompreensível, vinda de além da realidade conhecida, que talvez nem saiba da existência do bruxo. Na prática, o patrono oferece magias de encantamento e controle mental, reforçando o lado misterioso e perturbador do bruxo.',
      en: "The Great Old One is an alien, incomprehensible entity from beyond known reality, one that may not even be aware the warlock exists. In practice, this patron grants enchantment and mind-control spells, reinforcing the warlock's mysterious, unsettling side.",
    },
  },
};
