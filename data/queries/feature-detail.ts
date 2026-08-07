import type { SQLiteDatabase } from 'expo-sqlite';

import { getFeatureUsage, type RecoveryType } from '@/constants/feature-usage-overrides';
import { toEntries } from '../rows';
import { extractBackgroundFeature, type FeatureSectionKey } from './character-features';
import { getTranslations, localizedEntries, localizedName } from './localize';

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
}

type FeatureKind = 'class_feature' | 'subclass_feature' | 'racial_trait' | 'background';

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
  compositeId: string
): Promise<FeatureDetail | null> {
  const table = kind === 'class_feature' ? 'class_features' : 'subclass_features';
  const row = await db.getFirstAsync<{ id: number; name: string; level: number; entries: string }>(
    `SELECT id, name, level, entries FROM ${table} WHERE id = ?`,
    numericId
  );
  if (!row) return null;

  const translations = await getTranslations(db, kind);
  const name = localizedName(row.id, row.name, translations);
  const entries = stripLeadingTitleEntry(name, localizedEntries(row.id, toEntries(row.entries), translations));

  return {
    id: compositeId,
    section: 'classe',
    categoryLabel: kind === 'class_feature' ? 'Característica de Classe' : 'Característica de Subclasse',
    name,
    level: row.level,
    entries,
    ...getFeatureUsage(row.name),
  };
}

async function getRacialTrait(db: SQLiteDatabase, numericId: number, compositeId: string): Promise<FeatureDetail | null> {
  const row = await db.getFirstAsync<{ id: number; name: string; entries: string }>(
    'SELECT id, name, entries FROM racial_traits WHERE id = ?',
    numericId
  );
  if (!row) return null;

  const translations = await getTranslations(db, 'racial_trait');
  const name = localizedName(row.id, row.name, translations);
  const entries = stripLeadingTitleEntry(name, localizedEntries(row.id, toEntries(row.entries), translations));

  return {
    id: compositeId,
    section: 'racial',
    categoryLabel: 'Característica Racial',
    name,
    entries,
    ...getFeatureUsage(row.name),
  };
}

async function getBackgroundFeature(db: SQLiteDatabase, numericId: number, compositeId: string): Promise<FeatureDetail | null> {
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

export async function getFeatureDetailById(db: SQLiteDatabase, id: string): Promise<FeatureDetail | null> {
  const match = id.match(ID_PATTERN);
  if (!match) return null;

  const kind = match[1] as FeatureKind;
  const numericId = Number(match[2]);

  if (kind === 'class_feature' || kind === 'subclass_feature') {
    return getClassOrSubclassFeature(db, kind, numericId, id);
  }
  if (kind === 'racial_trait') {
    return getRacialTrait(db, numericId, id);
  }
  return getBackgroundFeature(db, numericId, id);
}
