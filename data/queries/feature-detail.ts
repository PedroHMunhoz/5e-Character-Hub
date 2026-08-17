import type { SQLiteDatabase } from 'expo-sqlite';

import { getFeatureUsage, type RecoveryType } from '@/constants/feature-usage-overrides';
import { getDraconicAncestryDetailEntries } from '@/constants/draconic-ancestry';
import {
  FAVORED_ENEMY_HUMANOID_KEY,
  FAVORED_ENEMY_HUMANOID_RACES,
  getFavoredEnemyDetailEntries,
} from '@/constants/favored-enemy';
import { getFavoredTerrainDetailEntries } from '@/constants/favored-terrain';
import { LEVEL_PROGRESSION_TABLES, type LevelProgressionTableData } from '@/constants/level-progression-tables';
import { toEntries } from '../rows';
import { extractBackgroundFeature, type FeatureSectionKey } from './character-features';
import { getLanguageById } from './languages';
import { getTranslations, localizedEntries, localizedName } from './localize';
import { getOptionalFeatureByEnglishName } from './optional-features';

export interface FeatureDetail {
  id: string;
  section: FeatureSectionKey;
  categoryLabel: string;
  name: string;
  level?: number;
  usageType: 'ativa' | 'passiva';
  maxUses?: string;
  recovery?: RecoveryType[];
  entries: string[];
  progressionTables?: LevelProgressionTableData[];
}

type FeatureKind = 'class_feature' | 'subclass_feature' | 'racial_trait' | 'background';

// The player's own choices for the various level-1 wizard picks that a
// generic class_features row can't express on its own (see Fighting Style's
// existing precedent below) - grouped into one object since this list keeps
// growing.
export interface FeatureDetailChoices {
  fightingStyle?: string | null;
  favoredEnemyType?: string | null;
  favoredEnemyHumanoidRaces?: [string, string] | null;
  favoredTerrainType?: string | null;
  // Slot 0: the single creature type's language, or the first humanoid
  // race's. Slot 1: only used for the second humanoid race - each favored
  // enemy grants its own language independently, see
  // context/wizard-context.tsx's FavoredEnemyLanguageSlot.
  favoredEnemyLanguageIds?: [number | 'none' | null, number | 'none' | null];
  // Dragonborn-only - see constants/draconic-ancestry.ts.
  draconicAncestry?: string | null;
}

async function formatLanguageName(
  db: SQLiteDatabase,
  value: number | 'none' | null | undefined
): Promise<string | null> {
  if (typeof value === 'number') {
    const language = await getLanguageById(db, value);
    return language?.name ?? null;
  }
  return null;
}

const ID_PATTERN = /^(class_feature|subclass_feature|racial_trait|background)-(\d+)$/;

// Racial traits (and occasionally other sources) echo their own name as the
// first entry, e.g. entries: ["Esperteza Gnômica:", "Você possui..."] - the
// screen title already shows the name, so drop that redundant line.
function stripLeadingTitleEntry(name: string, entries: string[]): string[] {
  return entries[0]?.trim() === `${name}:` ? entries.slice(1) : entries;
}

async function getClassOrSubclassFeature(
  db: SQLiteDatabase,
  kind: 'class_feature' | 'subclass_feature',
  numericId: number,
  compositeId: string,
  choices?: FeatureDetailChoices
): Promise<FeatureDetail | null> {
  const table = kind === 'class_feature' ? 'class_features' : 'subclass_features';
  const row = await db.getFirstAsync<{ id: number; name: string; level: number; entries: string }>(
    `SELECT id, name, level, entries FROM ${table} WHERE id = ?`,
    numericId
  );
  if (!row) return null;

  const translations = await getTranslations(db, kind);
  const name = localizedName(row.id, row.name, translations);
  let entries = stripLeadingTitleEntry(name, localizedEntries(row.id, toEntries(row.entries), translations));

  // The book's own "Fighting Style" text is just "choose one of the options
  // below" - it never says which one the character actually has. Append the
  // chosen style's own rule text (from optional_features) so the player
  // sees the concrete mechanic here instead of just the generic framing.
  if (kind === 'class_feature' && row.name === 'Fighting Style' && choices?.fightingStyle) {
    const chosen = await getOptionalFeatureByEnglishName(db, choices.fightingStyle);
    if (chosen) entries = [...entries, ...chosen.entries];
  }

  // Same reasoning as Fighting Style above - Favored Enemy/Natural Explorer's
  // book text just says "choose a type", it never names the player's actual
  // pick, since these have no optional_features catalog to look up (see
  // constants/favored-enemy.ts).
  if (kind === 'class_feature' && row.name === 'Favored Enemy' && choices?.favoredEnemyType) {
    entries = [
      ...entries,
      ...getFavoredEnemyDetailEntries(choices.favoredEnemyType, choices.favoredEnemyHumanoidRaces ?? null),
    ];
    // PHB: "you also learn one language of your choice that is spoken by
    // your favored enemies, if they speak one at all" - see
    // constants/favored-enemy.ts for the per-type/race language lists. Each
    // favored enemy grants its own language, so the humanoid alternative
    // shows one line per race instead of a single shared line.
    const [languageSlot0, languageSlot1] = choices.favoredEnemyLanguageIds ?? [null, null];
    if (choices.favoredEnemyType === FAVORED_ENEMY_HUMANOID_KEY) {
      const [raceKey0, raceKey1] = choices.favoredEnemyHumanoidRaces ?? [null, null];
      for (const [raceKey, languageSlot] of [
        [raceKey0, languageSlot0],
        [raceKey1, languageSlot1],
      ] as const) {
        const raceLabel = raceKey ? FAVORED_ENEMY_HUMANOID_RACES.find((r) => r.key === raceKey)?.labelPt : null;
        if (!raceLabel) continue;
        const languageName = await formatLanguageName(db, languageSlot);
        if (languageName) entries = [...entries, `Idioma do ${raceLabel}: ${languageName}.`];
      }
    } else if (typeof languageSlot0 === 'number') {
      const languageName = await formatLanguageName(db, languageSlot0);
      if (languageName) entries = [...entries, `Idioma aprendido: ${languageName}.`];
    } else if (languageSlot0 === 'none') {
      entries = [...entries, 'Esse tipo de inimigo normalmente não fala nenhum idioma.'];
    }
  }
  if (kind === 'class_feature' && row.name === 'Natural Explorer' && choices?.favoredTerrainType) {
    entries = [...entries, ...getFavoredTerrainDetailEntries(choices.favoredTerrainType)];
  }

  return {
    id: compositeId,
    section: 'classe',
    categoryLabel: kind === 'class_feature' ? 'Característica de Classe' : 'Característica de Subclasse',
    name,
    level: row.level,
    entries,
    progressionTables: kind === 'class_feature' ? LEVEL_PROGRESSION_TABLES[row.name] : undefined,
    ...getFeatureUsage(row.name),
  };
}

async function getRacialTrait(
  db: SQLiteDatabase,
  numericId: number,
  compositeId: string,
  choices?: FeatureDetailChoices
): Promise<FeatureDetail | null> {
  const row = await db.getFirstAsync<{ id: number; name: string; entries: string }>(
    'SELECT id, name, entries FROM racial_traits WHERE id = ?',
    numericId
  );
  if (!row) return null;

  const translations = await getTranslations(db, 'racial_trait');
  const name = localizedName(row.id, row.name, translations);
  let entries = stripLeadingTitleEntry(name, localizedEntries(row.id, toEntries(row.entries), translations));

  // Dragonborn's Draconic Ancestry/Breath Weapon/Damage Resistance traits
  // just say "choose a dragon type, see the table" - they never name the
  // player's actual pick, same reasoning as Fighting Style/Favored Enemy
  // above. See constants/draconic-ancestry.ts.
  if (
    (row.name === 'Draconic Ancestry' || row.name === 'Breath Weapon' || row.name === 'Damage Resistance') &&
    choices?.draconicAncestry
  ) {
    entries = [...entries, ...getDraconicAncestryDetailEntries(choices.draconicAncestry, row.name)];
  }

  return {
    id: compositeId,
    section: 'racial',
    categoryLabel: 'Característica Racial',
    name,
    entries,
    ...getFeatureUsage(row.name),
  };
}

async function getBackgroundFeature(
  db: SQLiteDatabase,
  numericId: number,
  compositeId: string
): Promise<FeatureDetail | null> {
  const row = await db.getFirstAsync<{ id: number; name: string; entries: string }>(
    'SELECT id, name, entries FROM backgrounds WHERE id = ?',
    numericId
  );
  if (!row) return null;

  const translations = await getTranslations(db, 'background');
  const entries = localizedEntries(row.id, toEntries(row.entries), translations);
  const extracted = extractBackgroundFeature(entries);
  const name = extracted?.name ?? localizedName(row.id, row.name, translations);

  return {
    id: compositeId,
    section: 'antecedente',
    categoryLabel: 'Característica de Antecedente',
    name,
    entries: stripLeadingTitleEntry(name, extracted?.body ?? entries),
    ...getFeatureUsage('Background Feature'),
  };
}

export async function getFeatureDetailById(
  db: SQLiteDatabase,
  id: string,
  choices?: FeatureDetailChoices
): Promise<FeatureDetail | null> {
  const match = id.match(ID_PATTERN);
  if (!match) return null;

  const kind = match[1] as FeatureKind;
  const numericId = Number(match[2]);

  if (kind === 'class_feature' || kind === 'subclass_feature') {
    return getClassOrSubclassFeature(db, kind, numericId, id, choices);
  }
  if (kind === 'racial_trait') {
    return getRacialTrait(db, numericId, id, choices);
  }
  return getBackgroundFeature(db, numericId, id);
}
