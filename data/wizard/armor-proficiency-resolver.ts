// Parses armor-proficiency DSLs. Two different shapes, both confirmed live:
// - Class (classes.starting_proficiencies.armor): a flat category array,
//   e.g. Fighter `["light","medium","heavy","shield"]`.
// - Race/subrace (races.armor_proficiencies, see db/schema.sql): `{category:
//   true}` groups, same fixed-grant family as
//   skill-proficiency-resolver.ts's parseBackgroundSkillProficiencies - only
//   Mountain Dwarf has this in the PHB, e.g. `[{"light":true,"medium":true}]`.
// No `choose` clause in either shape for any PHB armor grant - always a
// fixed list, never a player pick.

import type { ArmorCategory } from '@/types/character';

const ARMOR_CATEGORY_KEYS: ArmorCategory[] = ['light', 'medium', 'heavy', 'shield'];

function isArmorCategory(value: string): value is ArmorCategory {
  return (ARMOR_CATEGORY_KEYS as string[]).includes(value);
}

export function parseClassArmorProficiencies(raw: unknown): ArmorCategory[] {
  return ((raw as string[] | null) ?? []).filter(isArmorCategory);
}

export function parseRaceArmorProficiencies(raw: unknown): ArmorCategory[] {
  const groups = (raw as Record<string, boolean>[] | null) ?? [];
  const keys: ArmorCategory[] = [];
  for (const group of groups) {
    for (const [key, granted] of Object.entries(group)) {
      if (granted && isArmorCategory(key)) keys.push(key);
    }
  }
  return keys;
}
