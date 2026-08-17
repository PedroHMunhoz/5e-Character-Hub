// Static pt-BR labels for 5e base-item taxonomy codes (weapon category,
// weapon properties, armor weight class). These are fixed rules terms, not
// book prose, so they don't need to come from the `translations` table.

import type { ArmorCategory } from '@/types/character';

export const WEAPON_CATEGORY_LABELS: Record<string, string> = {
  simple: 'Simples',
  martial: 'Marcial',
};

export const WEAPON_PROPERTY_LABELS: Record<string, string> = {
  '2H': 'Duas Mãos',
  A: 'Munição',
  F: 'Acuidade',
  H: 'Pesada',
  L: 'Leve',
  LD: 'Recarga',
  R: 'Alcance',
  S: 'Especial',
  T: 'Arremesso',
  V: 'Versátil',
};

export const ARMOR_TYPE_LABELS: Record<string, string> = {
  LA: 'Leve',
  MA: 'Média',
  HA: 'Pesada',
  S: 'Escudo',
};

// pt-BR labels for the proficiency category keys used by
// CharacterSheet.armorProficiencies (data/wizard/armor-proficiency-resolver.ts)
// - distinct from ARMOR_TYPE_LABELS above, which is keyed by the base_items/
// items `type` column code ("LA"/"MA"/"HA"/"S"), not the category key.
export const ARMOR_CATEGORY_LABELS: Record<ArmorCategory, string> = {
  light: 'Leve',
  medium: 'Média',
  heavy: 'Pesada',
  shield: 'Escudo',
};

// Maps a base_items/items `type` column code to the proficiency category it
// requires, so an equipped armor/shield can be checked against
// CharacterSheet.armorProficiencies.
export const ARMOR_TYPE_TO_CATEGORY: Record<string, ArmorCategory> = {
  LA: 'light',
  MA: 'medium',
  HA: 'heavy',
  S: 'shield',
};

// dmgType codes from base_items.damage JSON (5etools convention).
export const DAMAGE_TYPE_LABELS: Record<string, string> = {
  B: 'Concussão',
  P: 'Perfurante',
  S: 'Cortante',
};

// How a weapon can be equipped, derived from its property codes: '2H' means
// it can only ever be wielded two-handed, 'V' (versatile) means it can be
// wielded one-handed OR two-handed, otherwise it's strictly one-handed.
export type WeaponHandedness = 'oneHanded' | 'versatile' | 'twoHanded';

export function getWeaponHandedness(propertyCodes: string[]): WeaponHandedness {
  if (propertyCodes.includes('2H')) return 'twoHanded';
  if (propertyCodes.includes('V')) return 'versatile';
  return 'oneHanded';
}

// Which equip slot an armor/shield item occupies - shields (type 'S') share a
// slot separate from worn body armor, so one of each can be equipped at
// once, but not two of the same kind.
export function getArmorSlotKind(type: string | null): 'body' | 'shield' {
  return type === 'S' ? 'shield' : 'body';
}
