// Flavor text resumido de cada sub-raça do PHB, pra exibir no wizard
// (app/wizard/index.tsx) assim que o jogador seleciona a sub-raça. Mesmo padrão de
// constants/race-info.ts, mas mais curto (1-2 frases) já que a sub-raça só refina uma raça
// cuja descrição completa já apareceu no card acima - texto resumido a partir da própria
// seção da sub-raça no PHB (translations/pt-BR/_raw-extracts/PHB.txt), bilíngue, com
// minhas próprias palavras.
//
// Chaveado pelo mesmo identificador estável já usado por
// constants/subrace-names.ts's SUBRACE_DISPLAY_NAME_BY_ENGLISH_NAME (Race.englishName da
// sub-raça, ex. "Hill", "Drow" - 5etools só grava a palavra distintiva, não o nome
// composto). Cobre as 9 sub-raças nomeadas do PHB; Dragonborn/Half-Elf/Half-Orc/Tiefling/
// Human não têm sub-raça nenhuma (ver comentário em subrace-names.ts), então não têm
// entrada aqui.
import type { LocalizedText } from './class-info';

export const SUBRACE_INFO: Record<string, LocalizedText> = {
  Hill: {
    'pt-BR':
      'Anões da colina somam intuição aguçada e notável resiliência à robustez natural dos anões, sendo o tipo mais comum em muitos reinos anões da superfície.',
    en: 'Hill dwarves add keen intuition and remarkable toughness to the natural sturdiness of dwarves, and are the most common kind found in many dwarven kingdoms above ground.',
  },
  Mountain: {
    'pt-BR':
      'Anões da montanha são ainda mais fortes e resistentes que a média da raça, acostumados a uma vida difícil em terrenos ásperos, e vêm com treinamento nato em armaduras leves e médias.',
    en: 'Mountain dwarves are stronger and tougher than the dwarven average, hardened by life in harsh terrain, and come with natural training in light and medium armor.',
  },
  High: {
    'pt-BR':
      'Altos elfos unem uma mente afiada a um domínio básico da magia, sendo o tipo de elfo mais estudioso e ligado às artes arcanas.',
    en: 'High elves pair a sharp mind with a basic grasp of magic, making them the most scholarly and arcane-minded kind of elf.',
  },
  Wood: {
    'pt-BR':
      'Elfos da floresta têm sentidos e instintos aguçados, movendo-se com rapidez e furtividade pelas matas onde vivem, reclusos e desconfiados de quem não é élfico.',
    en: 'Wood elves have sharp senses and instincts, moving quickly and quietly through the forests they call home, reclusive and wary of outsiders.',
  },
  Drow: {
    'pt-BR':
      'Drow são elfos de pele negra banidos da superfície por seguirem o caminho sombrio da deusa Lolth, e vivem hoje nas profundezas do Subterrâneo, com visão no escuro superior e magia inata.',
    en: 'Drow are dark-skinned elves banished from the surface for following the dark goddess Lolth, now dwelling deep underground with superior darkvision and innate magic.',
  },
  Forest: {
    'pt-BR':
      'Gnomos da floresta têm talento natural para ilusões e velocidade e furtividade acima da média, vivendo escondidos em comunidades silvestres e fazendo amizade com pequenos animais.',
    en: 'Forest gnomes have a natural knack for illusion and above-average speed and stealth, living hidden in woodland communities and befriending small animals.',
  },
  Rock: {
    'pt-BR':
      'Gnomos das rochas somam inventividade e resistência acima da média dos gnomos, sendo o tipo mais comum da raça e talentosos com engenhocas e mecanismos.',
    en: 'Rock gnomes add above-average inventiveness and resilience to the gnome norm, and are the most common kind of gnome, skilled with tinkering and mechanisms.',
  },
  Lightfoot: {
    'pt-BR':
      'Halflings pés-leves se escondem com facilidade e têm um jeito especialmente afável, sendo o tipo mais numeroso e o mais propenso a viajar ou viver entre outras raças.',
    en: 'Lightfoot halflings hide with ease and have an especially easygoing manner, and are the most numerous kind, more likely to travel or live among other races.',
  },
  Stout: {
    'pt-BR':
      'Halflings robustos são mais resistentes que a média da raça e têm resistência natural a venenos, com alguns dizendo que carregam sangue de anão.',
    en: 'Stout halflings are tougher than the halfling average and have a natural resistance to poison, with some saying they carry dwarf blood.',
  },
};
