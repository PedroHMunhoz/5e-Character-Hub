import type { SQLiteDatabase } from 'expo-sqlite';

import { formatDraconicAncestryFeatureName } from '@/constants/draconic-ancestry';
import { getFeatureUsage, type RecoveryType } from '@/constants/feature-usage-overrides';
import { toEntries } from '../rows';
import { getTranslations, localizedEntries, localizedName } from './localize';

export type FeatureSectionKey = 'classe' | 'racial' | 'antecedente';

export interface CuratedFeature {
  id: string;
  section: FeatureSectionKey;
  name: string;
  usageType: 'ativa' | 'passiva';
  maxUses?: string;
  recovery?: RecoveryType[];
}

function withUsage(id: string, section: FeatureSectionKey, englishName: string, name: string): CuratedFeature {
  return { id, section, name, ...getFeatureUsage(englishName) };
}

export interface CharacterFeatureQuery {
  raceId: number;
  subraceId: number | null;
  classId: number;
  subclassId: number | null;
  backgroundId: number;
  level: number;
  // Dragonborn-only, set by the creation wizard - see
  // constants/draconic-ancestry.ts for why this isn't just another racial
  // trait row.
  draconicAncestry?: string | null;
}

// Replaces the earlier hardcoded-id version (built for the app's original
// level-2 Rock Gnome Evocation Wizard demo character) now that every
// character carries real raceId/classId/subclassId/backgroundId from the
// creation wizard - queries the actual grants for THIS character instead of
// a fixed id list.
export async function getCharacterFeatures(db: SQLiteDatabase, query: CharacterFeatureQuery): Promise<CuratedFeature[]> {
  // Sequential, not Promise.all: overlapping queries on the same
  // SQLiteDatabase connection can crash on native (see data/queries/spells.ts).
  const classRows = await db.getAllAsync<{ id: number; name: string }>(
    "SELECT id, name FROM class_features WHERE class_id = ? AND level <= ? AND source = 'PHB'",
    query.classId,
    query.level
  );
  const subclassRows =
    query.subclassId != null
      ? await db.getAllAsync<{ id: number; name: string }>(
          "SELECT id, name FROM subclass_features WHERE subclass_id = ? AND level <= ? AND source = 'PHB'",
          query.subclassId,
          query.level
        )
      : [];
  const raceIds = query.subraceId != null ? [query.raceId, query.subraceId] : [query.raceId];
  const racePlaceholders = raceIds.map(() => '?').join(', ');
  const racialRows = await db.getAllAsync<{ id: number; name: string }>(
    `SELECT id, name FROM racial_traits WHERE race_id IN (${racePlaceholders}) ORDER BY sort_order`,
    ...raceIds
  );
  const backgroundRow = await db.getFirstAsync<{ id: number; name: string; entries: string }>(
    'SELECT id, name, entries FROM backgrounds WHERE id = ?',
    query.backgroundId
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

  if (query.draconicAncestry) {
    const name = formatDraconicAncestryFeatureName(query.draconicAncestry);
    if (name) features.push(withUsage('draconic-ancestry', 'racial', 'Draconic Ancestry (choice)', name));
  }

  if (backgroundRow) {
    const entries = localizedEntries(backgroundRow.id, toEntries(backgroundRow.entries), backgroundTranslations);
    const featureName =
      extractBackgroundFeature(entries)?.name ??
      localizedName(backgroundRow.id, backgroundRow.name, backgroundTranslations);
    features.push(withUsage(`background-${backgroundRow.id}`, 'antecedente', 'Background Feature', featureName));
  }

  return features;
}

// Background entries interleave section headers with prose; the granted
// feature's name shows up as its own entry, e.g. "Característica: Pesquisador:"
// (or "Feature: Researcher:" when untranslated), followed by the paragraphs
// describing it, up to the next header-like entry (one ending in ":").
export function extractBackgroundFeature(entries: string[]): { name: string; body: string[] } | null {
  const headerIndex = entries.findIndex((entry) => /^(?:Característica|Feature):\s*(.+):$/.test(entry));
  if (headerIndex === -1) return null;

  const match = entries[headerIndex].match(/^(?:Característica|Feature):\s*(.+):$/)!;
  const body: string[] = [];
  for (let i = headerIndex + 1; i < entries.length && !entries[i].endsWith(':'); i++) {
    body.push(entries[i]);
  }

  return { name: match[1], body };
}
