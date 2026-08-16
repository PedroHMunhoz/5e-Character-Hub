// Ranger "Favored Enemy" (PHB p.90, class_features id 241) - the 13 creature
// types + the "two humanoid races" alternative are embedded as running prose
// in the class feature's own entries (5etools' unexpanded `type=aberration,
// type=beast, ...` template), not modeled as optional_features catalog rows
// the way Fighter's Fighting Style is - so this is a plain constant, same
// pattern as constants/draconic-ancestry.ts. Labels reuse the exact pt-BR
// vocabulary already established by the translated class_features entries
// for this same feature (translations table, entity_type='class_feature',
// entity_id=241) - e.g. "corruptores" for fiend, not "demônios". blurbPt is
// new content (no per-type flavor text exists anywhere in the dataset): a
// one-sentence gloss with 2-3 classic D&D monster examples per type, to help
// a player unfamiliar with the jargon understand what they're picking.
export interface FavoredEnemyTypeOption {
  key: string;
  labelPt: string;
  blurbPt: string;
  // Language.englishName(s) this type's members plausibly speak (common D&D
  // knowledge - the same language(s) each type is associated with in any
  // bestiary): empty when Intelligence is typically too low (roughly <4) to
  // have language proficiency at all, one entry when there's a single
  // canonical language, two+ only for types with genuine in-lore ambiguity
  // (fiends: demons speak Abyssal, devils speak Infernal). The wizard locks
  // the language picker to this list - a single entry (or none) is not
  // player-editable, since there's nothing truthful to switch it to; only a
  // 2+ list actually renders as a choice.
  possibleLanguageEnglishNames: string[];
}

// Sentinel used both as an entry in a caller's resolved-language state and
// as a WizardDraft.favoredEnemyLanguageIds slot value - means "this
// type/race doesn't speak any language" (the PHB's own "if they speak one at
// all" hedge), distinct from `null` which means "not resolved yet".
export const FAVORED_ENEMY_NO_LANGUAGE = 'none';

export const FAVORED_ENEMY_TYPES: FavoredEnemyTypeOption[] = [
  {
    key: 'aberration',
    labelPt: 'Aberração',
    blurbPt: 'Criaturas de anatomia alienígena e mente incompreensível, como olhos flutuantes e devoradores de mentes.',
    possibleLanguageEnglishNames: ['Deep Speech'],
  },
  {
    key: 'beast',
    labelPt: 'Besta',
    blurbPt: 'Animais comuns e criaturas naturais, como lobos, ursos e águias gigantes.',
    possibleLanguageEnglishNames: [],
  },
  {
    key: 'celestial',
    labelPt: 'Celestial',
    blurbPt: 'Seres de origem divina dos planos superiores, como anjos e pégasos.',
    possibleLanguageEnglishNames: ['Celestial'],
  },
  {
    key: 'construct',
    labelPt: 'Constructo',
    blurbPt: 'Criaturas artificiais animadas por magia, como golens e armaduras animadas.',
    possibleLanguageEnglishNames: [],
  },
  {
    key: 'dragon',
    labelPt: 'Dragão',
    blurbPt: 'Répteis colossais, de filhotes a dragões adultos como o Dragão Vermelho.',
    possibleLanguageEnglishNames: ['Draconic'],
  },
  {
    key: 'elemental',
    labelPt: 'Elemental',
    blurbPt: 'Seres feitos da matéria pura dos planos elementais, como elementais de fogo e de água.',
    possibleLanguageEnglishNames: ['Primordial'],
  },
  {
    key: 'fey',
    labelPt: 'Fada',
    blurbPt: 'Criaturas ligadas à magia da natureza e ao Plano Feérico, como duendes, sátiros e dríades.',
    possibleLanguageEnglishNames: ['Sylvan'],
  },
  {
    key: 'fiend',
    labelPt: 'Corruptor',
    blurbPt: 'Seres malignos vindos dos planos inferiores, como demônios e diabos.',
    // Genuine ambiguity: demons speak Abyssal, devils speak Infernal - the
    // only PHB creature type with more than one plausible language, so this
    // is the one case that actually renders as a real player choice.
    possibleLanguageEnglishNames: ['Abyssal', 'Infernal'],
  },
  {
    key: 'giant',
    labelPt: 'Gigante',
    blurbPt: 'Humanoides de porte colossal, como ogros e gigantes das colinas.',
    possibleLanguageEnglishNames: ['Giant'],
  },
  {
    key: 'monstrosity',
    labelPt: 'Monstruosidade',
    blurbPt: 'Criaturas antinaturais, muitas vezes fruto de magia ou mutação, como grifos e quimeras.',
    possibleLanguageEnglishNames: [],
  },
  {
    key: 'ooze',
    labelPt: 'Limo',
    blurbPt: 'Massas amorfas e viscosas, como o cubo gelatinoso e o limo cinzento.',
    possibleLanguageEnglishNames: [],
  },
  {
    key: 'plant',
    labelPt: 'Planta',
    blurbPt: 'Vida vegetal animada e hostil, como trepadeiras assassinas e montes rastejantes.',
    possibleLanguageEnglishNames: [],
  },
  {
    key: 'undead',
    labelPt: 'Morto-vivo',
    blurbPt: 'Criaturas reanimadas por magia negra, como zumbis, esqueletos e vampiros.',
    possibleLanguageEnglishNames: [],
  },
];

export const FAVORED_ENEMY_HUMANOID_KEY = 'humanoid';

export const FAVORED_ENEMY_HUMANOID_OPTION: FavoredEnemyTypeOption = {
  key: FAVORED_ENEMY_HUMANOID_KEY,
  labelPt: 'Humanoides (duas raças)',
  blurbPt: 'Em vez de um tipo de criatura, escolha duas raças humanoides específicas, como gnolls e orcs.',
  // Unused - the humanoid case resolves each race's own language
  // independently instead, see getHumanoidRaceLanguages below.
  possibleLanguageEnglishNames: [],
};

// Common Monster Manual humanoid races, in English per the app's own
// established convention (see the translated Favored Enemy text itself:
// "duas raças de humanoides (como gnolls e orcs)" keeps race names
// untranslated) - except Lizardfolk, which already has a consecrated pt-BR
// translation in Brazilian D&D material ("Homem-Lagarto").
export interface HumanoidRaceOption {
  key: string;
  labelPt: string;
  blurbPt: string;
  // Same convention as FavoredEnemyTypeOption's field above - every real
  // humanoid race has exactly one canonical language in 5e lore, so this is
  // always a single-entry (locked) list. "Gnoll" is a custom language added
  // to the app's catalog specifically for this pick - see
  // db/overrides/custom-languages.json.
  possibleLanguageEnglishNames: string[];
}

export const FAVORED_ENEMY_HUMANOID_RACES: HumanoidRaceOption[] = [
  {
    key: 'bugbear',
    labelPt: 'Bugbear',
    blurbPt: 'Humanoides grandalhões e furtivos, parentes brutais dos goblins.',
    possibleLanguageEnglishNames: ['Goblin'],
  },
  {
    key: 'gnoll',
    labelPt: 'Gnoll',
    blurbPt: 'Humanoides com cabeça de hiena, movidos por fome insaciável.',
    possibleLanguageEnglishNames: ['Gnoll'],
  },
  {
    key: 'goblin',
    labelPt: 'Goblin',
    blurbPt: 'Humanoides pequenos e covardes, perigosos apenas em bando.',
    possibleLanguageEnglishNames: ['Goblin'],
  },
  {
    key: 'hobgoblin',
    labelPt: 'Hobgoblin',
    blurbPt: 'Humanoides disciplinados e militaristas, parentes maiores dos goblins.',
    possibleLanguageEnglishNames: ['Goblin'],
  },
  {
    key: 'kobold',
    labelPt: 'Kobold',
    blurbPt: 'Humanoides reptilianos pequenos que compensam a fraqueza física com armadilhas.',
    possibleLanguageEnglishNames: ['Draconic'],
  },
  {
    key: 'lizardfolk',
    labelPt: 'Homem-Lagarto',
    blurbPt: 'Humanoides répteis de mentalidade fria, habitantes de pântanos.',
    possibleLanguageEnglishNames: ['Draconic'],
  },
  {
    key: 'orc',
    labelPt: 'Orc',
    blurbPt: 'Humanoides guerreiros ferozes, organizados em tribos violentas.',
    possibleLanguageEnglishNames: ['Orc'],
  },
  {
    key: 'yuan-ti',
    labelPt: 'Yuan-ti',
    blurbPt: 'Humanoides híbridos de serpente, mestres em veneno e engano.',
    possibleLanguageEnglishNames: ['Abyssal'],
  },
];

function findFavoredEnemyType(key: string): FavoredEnemyTypeOption | null {
  if (key === FAVORED_ENEMY_HUMANOID_KEY) return FAVORED_ENEMY_HUMANOID_OPTION;
  return FAVORED_ENEMY_TYPES.find((option) => option.key === key) ?? null;
}

function findHumanoidRace(key: string): HumanoidRaceOption | null {
  return FAVORED_ENEMY_HUMANOID_RACES.find((option) => option.key === key) ?? null;
}

export function formatFavoredEnemyFeatureName(
  type: string | null,
  humanoidRaces: [string | null, string | null] | null
): string | null {
  if (type === FAVORED_ENEMY_HUMANOID_KEY) {
    const race1 = humanoidRaces?.[0] ? findHumanoidRace(humanoidRaces[0]) : null;
    const race2 = humanoidRaces?.[1] ? findHumanoidRace(humanoidRaces[1]) : null;
    if (!race1 || !race2) return null;
    return `Inimigo Favorito: ${race1.labelPt} e ${race2.labelPt}`;
  }
  if (!type) return null;
  const option = findFavoredEnemyType(type);
  return option ? `Inimigo Favorito: ${option.labelPt}` : null;
}

export function getFavoredEnemyDetailEntries(
  type: string | null,
  humanoidRaces: [string | null, string | null] | null
): string[] {
  if (type === FAVORED_ENEMY_HUMANOID_KEY) {
    const race1 = humanoidRaces?.[0] ? findHumanoidRace(humanoidRaces[0]) : null;
    const race2 = humanoidRaces?.[1] ? findHumanoidRace(humanoidRaces[1]) : null;
    if (!race1 || !race2) return [];
    return [`${race1.labelPt}: ${race1.blurbPt}`, `${race2.labelPt}: ${race2.blurbPt}`];
  }
  if (!type) return [];
  const option = findFavoredEnemyType(type);
  return option ? [`${option.labelPt}: ${option.blurbPt}`] : [];
}

// The list of Language.englishName(s) this favored-enemy type actually
// speaks - empty (no language), one (locked), or two+ (a real choice, only
// ever true for 'fiend' today). Returns [] for a null/unset type.
export function getFavoredEnemyTypeLanguages(type: string | null): string[] {
  if (!type || type === FAVORED_ENEMY_HUMANOID_KEY) return [];
  return findFavoredEnemyType(type)?.possibleLanguageEnglishNames ?? [];
}

// Same as above but for one specific humanoid race (the humanoid
// alternative grants a language per race, not one shared language - see
// app/wizard/class.tsx). Returns [] for a null/unset race.
export function getHumanoidRaceLanguages(raceKey: string | null): string[] {
  if (!raceKey) return [];
  return findHumanoidRace(raceKey)?.possibleLanguageEnglishNames ?? [];
}
