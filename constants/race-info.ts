// Flavor text resumido de cada raça do PHB, pra exibir no wizard (app/wizard/index.tsx)
// assim que o jogador seleciona a raça. Mesmo padrão de constants/class-info.ts: nenhuma
// descrição narrativa existe no dataset importado (db/schema.sql's `races` só tem colunas
// mecânicas - size/speed/darkvision/ability_bonuses/etc.), então isso é conteúdo novo,
// resumido a partir da abertura de cada raça no PHB
// (translations/pt-BR/_raw-extracts/PHB.txt) - li tudo, do cabeçalho da raça até o
// subtítulo "Nomes X", e resumi com minhas próprias palavras (não uma citação do livro),
// bilíngue, no mesmo formato de 3 frases das classes: (1) o que define a raça fisicamente/
// culturalmente, (2) como isso se traduz em personalidade/sociedade, (3) o que leva esses
// personagens a aventurar.
//
// Chaveado por `Race.englishName` (types/reference.ts) - já o identificador estável usado
// pelo resto do wizard pra isso, ex. `selectedRace?.englishName === 'Dragonborn'` em
// app/wizard/index.tsx - e não por `id` (reatribuído a cada `npm run db:import`) nem pelo
// nome localizado (muda com a tradução).
//
// Só as 9 raças base do PHB têm entrada aqui - sub-raças (Anão da Colina, Alto Elfo etc.)
// não têm flavor text próprio no livro, só diferenças de traços mecânicos, então herdam a
// descrição da raça-mãe (ver `Race.parentRaceId`) em vez de duplicar/fragmentar o texto.
import type { LocalizedText } from './class-info';

export const RACE_INFO: Record<string, LocalizedText> = {
  Dwarf: {
    'pt-BR':
      'Anões são um povo baixo e robusto de guerreiros, mineradores e artesãos, moldado por reinos escavados nas raízes das montanhas. Vivem centenas de anos e são profundamente leais ao clã e às tradições, guardando rancores e alianças por gerações. Costumam se aventurar em busca de tesouro, glória para seus deuses ou para restaurar a honra do próprio clã.',
    en: "Dwarves are a short, sturdy people of warriors, miners, and artisans, shaped by kingdoms carved into the roots of mountains. They live for centuries and are deeply loyal to clan and tradition, holding onto grudges and alliances for generations. They adventure in search of treasure, glory for their gods, or to restore their clan's honor.",
  },
  Elf: {
    'pt-BR':
      'Elfos são um povo mágico e longevo, ligado à natureza, à arte e à magia, com sentidos e reflexos além dos humanos. Vivem centenas de anos, o que lhes dá paciência e uma perspectiva de mundo muito mais ampla, preferindo a diplomacia à violência até que ela seja realmente necessária. Aventuram-se por pura fascinação por viagens e descobertas, ou para aprimorar suas habilidades marciais e mágicas.',
    en: "Elves are a magical, long-lived people bound to nature, art, and magic, with senses and reflexes beyond those of humans. Living for centuries gives them patience and a far broader view of the world, favoring diplomacy over violence until it's truly needed. They adventure out of sheer fascination with travel and discovery, or to hone their martial and magical skills.",
  },
  Halfling: {
    'pt-BR':
      'Halflings são um povo pequeno, prático e caseiro, que valoriza acima de tudo a paz, a boa comida e o conforto do lar. Apesar do tamanho, sobrevivem em um mundo de gente maior evitando o confronto direto e mantendo os pés no chão diante de qualquer problema. Aventuram-se por curiosidade, lealdade aos amigos ou o simples desejo de ver o mundo, sem nunca perder o apego a casa e família.',
    en: 'Halflings are a small, practical, home-loving people who value peace, good food, and the comfort of hearth and family above almost everything. Despite their size, they survive in a world of bigger folk by avoiding direct conflict and staying grounded in the face of trouble. They adventure out of curiosity, loyalty to friends, or a simple wish to see the world, never losing their attachment to home.',
  },
  Human: {
    'pt-BR':
      'Humanos são a mais jovem e mais numerosa das raças, com vidas curtas que os empurram a conquistar o máximo possível no tempo que têm. São extremamente diversos em aparência, cultura e ambição, adaptando-se com facilidade a quase qualquer lugar ou situação. Aventuram-se para buscar glória, riqueza ou um legado duradouro, deixando sua marca antes que o tempo se esgote.',
    en: 'Humans are the youngest and most numerous of the common races, their short lives pushing them to achieve as much as they can in the time they have. They are remarkably diverse in appearance, culture, and ambition, adapting easily to nearly any place or situation. They adventure to chase glory, wealth, or a lasting legacy, determined to leave their mark before time runs out.',
  },
  Dragonborn: {
    'pt-BR':
      'Draconatos são descendentes de dragões, com corpo humanoide coberto de escamas, força física notável e um sopro elemental herdado de seus ancestrais. Vivem em função da honra do próprio clã, valorizando disciplina, excelência e autossuficiência acima de quase tudo. Aventuram-se como forma de provar seu valor, servir seu clã ou simplesmente buscar um propósito que ainda não encontraram.',
    en: 'Dragonborn are descendants of dragons, with humanoid bodies covered in scales, notable physical strength, and an elemental breath inherited from their ancestors. They live for the honor of their clan, valuing discipline, excellence, and self-sufficiency above almost everything else. They adventure to prove their worth, serve their clan, or simply search for a purpose they have not yet found.',
  },
  Gnome: {
    'pt-BR':
      'Gnomos são um povo pequeno, curioso e engenhoso, movido por uma energia quase incontrolável por invenção, descoberta e diversão. Vivem vários séculos e tentam aproveitar cada momento ao máximo, equilibrando piadas e travessuras com um talento genuíno para engenharia e magia. Aventuram-se por pura curiosidade, sede de conhecimento ou vontade de testar suas próprias criações no mundo.',
    en: 'Gnomes are a small, curious, inventive people driven by a nearly unstoppable energy for invention, discovery, and fun. Living for several centuries, they try to make the most of every moment, balancing jokes and mischief with real talent for engineering and magic. They adventure out of pure curiosity, a thirst for knowledge, or a wish to test their own creations out in the world.',
  },
  'Half-Elf': {
    'pt-BR':
      'Meio-elfos vivem entre dois mundos sem pertencer inteiramente a nenhum deles, combinando a ambição e criatividade humanas com os sentidos refinados e o gosto artístico dos elfos. Muitas vezes não se encaixam totalmente nem entre humanos nem entre elfos, o que os torna andarilhos natos ou hábeis diplomatas, confortáveis transitando entre culturas diferentes. Aventuram-se em busca de um lugar para chamar de seu, de companhia ou simplesmente pela sede de viajar herdada de seus parentes élficos.',
    en: 'Half-elves live between two worlds without fully belonging to either, combining human ambition and creativity with the refined senses and artistic taste of elves. They often do not fully fit in with humans or elves, which makes them natural wanderers or skilled diplomats, comfortable moving between different cultures. They adventure in search of a place to belong, companionship, or simply the wanderlust inherited from their elven kin.',
  },
  'Half-Orc': {
    'pt-BR':
      'Meio-orcs nascem da união entre tribos orcs e humanas, herdando força física e ferocidade formidáveis, além de cicatrizes que contam a própria história. Sentem emoções intensamente e lutam constantemente contra o impulso à fúria herdado de sua ascendência orc, buscando equilíbrio através do autocontrole. Aventuram-se para provar seu valor, escapar do preconceito ou conquistar um lugar de respeito entre humanos e orcs.',
    en: 'Half-orcs are born from unions between orc and human tribes, inheriting formidable physical strength and ferocity, along with scars that tell their own story. They feel emotions intensely and constantly wrestle with the urge toward fury inherited from their orc ancestry, seeking balance through self-control. They adventure to prove their worth, escape prejudice, or earn a place of respect among both humans and orcs.',
  },
  Tiefling: {
    'pt-BR':
      'Tieflings carregam uma herança infernal visível no corpo — chifres, cauda e olhos sólidos — fruto de um pacto ancestral que os marca aos olhos dos outros, mesmo sem culpa própria. Crescem acostumados à desconfiança e aos olhares hostis, o que os torna resilientes e cautelosos, mas leais e fiéis a quem realmente conquista sua confiança. Aventuram-se para escapar do preconceito, traçar seu próprio caminho no mundo ou provar que não são definidos por sua origem.',
    en: "Tieflings carry a visible infernal heritage — horns, a tail, and solid-colored eyes — the result of an ancestral pact that marks them in others' eyes through no fault of their own. Growing up used to distrust and hostile stares makes them resilient and cautious, but fiercely loyal to anyone who truly earns their trust. They adventure to escape prejudice, carve their own path in the world, or prove they are not defined by where they came from.",
  },
};
