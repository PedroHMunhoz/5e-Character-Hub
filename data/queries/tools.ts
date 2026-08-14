import type { SQLiteDatabase } from 'expo-sqlite';

import { getTranslations, localizedName } from './localize';

// Where tool-proficiency items actually live: mundane artisan's tools and
// musical instruments are in `base_items` (type 'AT'/'INS' - same table/
// convention as data/queries/base-items.ts); kits (thieves' tools, disguise
// kit, herbalism kit, ...) and gaming sets are in `items` (type 'T'/'GS'),
// not `base_items` - confirmed live against the bundled db (see
// docs/TODO.md for the note to re-verify full PHB coverage).
export type ToolCategory = 'artisan' | 'instrument' | 'kit' | 'gamingSet';

export interface ToolItem {
  id: number;
  source: 'base_items' | 'items';
  name: string;
  // Raw (unlocalized) name - used to match the raw English tool-proficiency
  // DSL keys (e.g. "thieves' tools") in data/wizard/tool-proficiency-resolver.ts,
  // same englishName pattern as data/queries/races.ts's Race.englishName.
  englishName: string;
  category: ToolCategory;
}

const BASE_ITEM_CATEGORY_BY_TYPE: Record<string, ToolCategory> = {
  AT: 'artisan',
  INS: 'instrument',
};

const ITEM_CATEGORY_BY_TYPE: Record<string, ToolCategory> = {
  T: 'kit',
  GS: 'gamingSet',
};

// Both the class ("anyArtisansTool") and background ("anyGamingSet") DSLs
// use their own inconsistent naming for the same underlying categories -
// normalized here so the wizard's resolver doesn't need to know which side
// a choice came from.
const CATEGORY_ALIASES: Record<string, ToolCategory> = {
  anyArtisansTool: 'artisan',
  toolArtisan: 'artisan',
  anyMusicalInstrument: 'instrument',
  instrumentMusical: 'instrument',
  anyGamingSet: 'gamingSet',
  gamingSet: 'gamingSet',
};

export function normalizeToolCategoryKey(key: string): ToolCategory | null {
  return CATEGORY_ALIASES[key] ?? null;
}

export async function getAllToolItems(db: SQLiteDatabase): Promise<ToolItem[]> {
  const baseRows = await db.getAllAsync<{ id: number; name: string; type: string }>(
    `SELECT id, name, type FROM base_items WHERE source = 'PHB' AND type IN ('AT','INS') ORDER BY name`
  );
  const baseTranslations = await getTranslations(db, 'base_item');

  const itemRows = await db.getAllAsync<{ id: number; name: string; type: string }>(
    `SELECT id, name, type FROM items WHERE source = 'PHB' AND type IN ('T','GS') ORDER BY name`
  );
  const itemTranslations = await getTranslations(db, 'item');

  return [
    ...baseRows.map((row) => ({
      id: row.id,
      source: 'base_items' as const,
      name: localizedName(row.id, row.name, baseTranslations),
      englishName: row.name,
      category: BASE_ITEM_CATEGORY_BY_TYPE[row.type],
    })),
    ...itemRows.map((row) => ({
      id: row.id,
      source: 'items' as const,
      name: localizedName(row.id, row.name, itemTranslations),
      englishName: row.name,
      category: ITEM_CATEGORY_BY_TYPE[row.type],
    })),
  ];
}

export async function getToolItemsByCategory(db: SQLiteDatabase, category: ToolCategory): Promise<ToolItem[]> {
  const all = await getAllToolItems(db);
  return all.filter((item) => item.category === category);
}

// Looks up a specific tool by its raw English name (e.g. "thieves' tools")
// rather than category - used where a rule cares about one exact tool
// instead of "any artisan's tool"/"any gaming set" (e.g. Rogue's Expertise,
// which can only swap a skill pick for thieves' tools specifically).
export async function getToolItemByEnglishName(db: SQLiteDatabase, englishName: string): Promise<ToolItem | null> {
  const all = await getAllToolItems(db);
  const target = englishName.toLowerCase();
  return all.find((item) => item.englishName.toLowerCase() === target) ?? null;
}
