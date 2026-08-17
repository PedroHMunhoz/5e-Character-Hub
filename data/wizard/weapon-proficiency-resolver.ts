// Parses weapon-proficiency DSLs. Two different shapes, both confirmed live:
// - Class (classes.starting_proficiencies.weapons): a flat array mixing
//   bare category keywords ("simple"/"martial") with 5etools
//   `{@item slug|source|display}` tags for named-weapon grants, e.g. Rogue
//   `["simple","{@item hand crossbow|phb|hand crossbows}","{@item longsword|
//   phb|longswords}", ...]`.
// - Race/subrace (races.weapon_proficiencies, see db/schema.sql): already-
//   clean `"name|source": true` groups, no {@item} tag wrapper - e.g. Dwarf
//   `[{"battleaxe|phb":true,"handaxe|phb":true, ...}]`.
// Both resolve named weapons via getBaseItemsByNames (data/queries/
// equipment-lookup.ts), which already matches "name|source"-style refs
// against base_items - refName() only uses the name half anyway, so the
// {@item} tag's slug alone is enough once stripped.

import type { SQLiteDatabase } from 'expo-sqlite';

import type { WeaponCategory } from '@/types/character';
import { getBaseItemsByNames, type EquipmentLookupItem } from '@/data/queries/equipment-lookup';

const WEAPON_CATEGORY_KEYS: WeaponCategory[] = ['simple', 'martial'];

function isWeaponCategory(value: string): value is WeaponCategory {
  return (WEAPON_CATEGORY_KEYS as string[]).includes(value);
}

const ITEM_TAG_RE = /^\{@item ([^|}]+)/i;

// `{@item hand crossbow|phb|hand crossbows}` -> "hand crossbow" (the slug;
// getBaseItemsByNames/refName() only look at the name half of a ref, so the
// source/display segments aren't needed). A bare, non-tagged entry (a
// category keyword) is returned unchanged - callers filter those out first.
function tagToRefName(raw: string): string {
  const match = ITEM_TAG_RE.exec(raw);
  return match ? match[1] : raw;
}

export interface ResolvedWeaponProficiencies {
  categories: WeaponCategory[];
  items: EquipmentLookupItem[];
}

export async function resolveClassWeaponProficiencies(
  db: SQLiteDatabase,
  raw: unknown
): Promise<ResolvedWeaponProficiencies> {
  const entries = (raw as string[] | null) ?? [];
  const categories: WeaponCategory[] = [];
  const refs: string[] = [];
  for (const entry of entries) {
    if (isWeaponCategory(entry)) {
      categories.push(entry);
      continue;
    }
    refs.push(tagToRefName(entry));
  }
  const items = await getBaseItemsByNames(db, refs);
  return { categories, items };
}

export async function resolveRaceWeaponProficiencies(
  db: SQLiteDatabase,
  raw: unknown
): Promise<EquipmentLookupItem[]> {
  const groups = (raw as Record<string, boolean>[] | null) ?? [];
  const refs = groups.flatMap((group) =>
    Object.entries(group)
      .filter(([, granted]) => granted)
      .map(([name]) => name)
  );
  return getBaseItemsByNames(db, refs);
}
