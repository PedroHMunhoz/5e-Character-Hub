import type { SQLiteDatabase } from 'expo-sqlite';

import { FEATURE_USAGE_OVERRIDES } from '@/constants/feature-usage-overrides';
import { toEntries } from '../rows';
import { getTranslations, localizedEntries, localizedName } from './localize';

export type FeatureSectionKey = 'classe' | 'racial' | 'antecedente';

export interface CuratedFeature {
  id: string;
  section: FeatureSectionKey;
  name: string;
  usageType: 'ativa' | 'passiva';
  maxUses?: string;
  recovery?: string;
}

function withUsage(id: string, section: FeatureSectionKey, englishName: string, name: string): CuratedFeature {
  const override = FEATURE_USAGE_OVERRIDES[englishName];
  return {
    id,
    section,
    name,
    usageType: override?.usageType ?? 'passiva',
    maxUses: override?.maxUses,
    recovery: override?.recovery,
  };
}

// The demo character is a level-2 Rock Gnome Evocation Wizard with the Sage
// background. These ids were picked by hand and confirmed to have pt-BR
// translations in the bundled db (see the plan for how each was found).
const CLASS_FEATURE_IDS = [362, 363, 364]; // Arcane Recovery, Spellcasting, Arcane Tradition
const SUBCLASS_FEATURE_IDS = [874, 875, 876, 877]; // School of Evocation, Evocation Savant, Sculpt Spells, Potent Cantrip
const RACIAL_TRAIT_IDS = [820, 821, 250]; // Artificer's Lore, Tinker, Gnome Cunning
const SAGE_BACKGROUND_ID = 58;

export async function getCuratedCharacterFeatures(db: SQLiteDatabase): Promise<CuratedFeature[]> {
  const classPlaceholders = CLASS_FEATURE_IDS.map(() => '?').join(', ');
  const subclassPlaceholders = SUBCLASS_FEATURE_IDS.map(() => '?').join(', ');
  const racialPlaceholders = RACIAL_TRAIT_IDS.map(() => '?').join(', ');

  // Sequential, not Promise.all: overlapping queries on the same
  // SQLiteDatabase connection can crash on native (see data/queries/spells.ts).
  const classRows = await db.getAllAsync<{ id: number; name: string }>(
    `SELECT id, name FROM class_features WHERE id IN (${classPlaceholders})`,
    ...CLASS_FEATURE_IDS
  );
  const subclassRows = await db.getAllAsync<{ id: number; name: string }>(
    `SELECT id, name FROM subclass_features WHERE id IN (${subclassPlaceholders})`,
    ...SUBCLASS_FEATURE_IDS
  );
  const racialRows = await db.getAllAsync<{ id: number; name: string }>(
    `SELECT id, name FROM racial_traits WHERE id IN (${racialPlaceholders})`,
    ...RACIAL_TRAIT_IDS
  );
  const backgroundRow = await db.getFirstAsync<{ id: number; name: string; entries: string }>(
    'SELECT id, name, entries FROM backgrounds WHERE id = ?',
    SAGE_BACKGROUND_ID
  );
  const classTranslations = await getTranslations(db, 'class_feature');
  const subclassTranslations = await getTranslations(db, 'subclass_feature');
  const racialTranslations = await getTranslations(db, 'racial_trait');
  const backgroundTranslations = await getTranslations(db, 'background');

  const features: CuratedFeature[] = [];

  for (const row of classRows) {
    const name = localizedName(row.id, row.name, classTranslations);
    features.push(withUsage(`class_feature-${row.id}`, 'classe', row.name, name));
  }

  for (const row of subclassRows) {
    const name = localizedName(row.id, row.name, subclassTranslations);
    features.push(withUsage(`subclass_feature-${row.id}`, 'classe', row.name, name));
  }

  for (const row of racialRows) {
    const name = localizedName(row.id, row.name, racialTranslations);
    features.push(withUsage(`racial_trait-${row.id}`, 'racial', row.name, name));
  }

  if (backgroundRow) {
    const entries = localizedEntries(backgroundRow.id, toEntries(backgroundRow.entries), backgroundTranslations);
    const featureName = extractBackgroundFeatureName(entries) ?? localizedName(backgroundRow.id, backgroundRow.name, backgroundTranslations);
    features.push(withUsage(`background-${backgroundRow.id}`, 'antecedente', 'Background Feature', featureName));
  }

  return features;
}

// Background entries interleave section headers with prose; the granted
// feature's name shows up as its own entry, e.g. "Característica: Pesquisador:"
// (or "Feature: Researcher:" when untranslated).
function extractBackgroundFeatureName(entries: string[]): string | null {
  for (const entry of entries) {
    const match = entry.match(/^(?:Característica|Feature):\s*(.+):$/);
    if (match) return match[1];
  }
  return null;
}
