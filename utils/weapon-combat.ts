import type { WeaponCategory, WeaponSlot } from '@/types/character';

import { getAbilityModifier } from './ability-modifier';

export type WeaponAttackAbility = 'str' | 'dex' | 'finesse';

export function getWeaponAbilityModifier(
  attackAbility: WeaponAttackAbility,
  strScore: string,
  dexScore: string
): number {
  const strMod = getAbilityModifier(strScore) ?? 0;
  const dexMod = getAbilityModifier(dexScore) ?? 0;

  if (attackAbility === 'finesse') return Math.max(strMod, dexMod);
  return attackAbility === 'dex' ? dexMod : strMod;
}

export function formatSpacedModifier(value: number): string {
  return value < 0 ? `- ${Math.abs(value)}` : `+ ${value}`;
}

export interface WeaponAttackDamageItem {
  attackAbility: WeaponAttackAbility;
  isRanged: boolean;
  weaponCategory?: WeaponCategory;
  damageDice: string;
  damageDiceVersatile?: string;
  // itemKey('base_items', item.id) - precomputed by the caller so this
  // module stays free of the data/queries dependency.
  itemProficiencyKey: string;
  // Whether this weapon has the "Light" property - PHB's basic two-weapon-
  // fighting rule (p.195) only allows the off-hand bonus-action attack when
  // BOTH equipped weapons are Light (the Dual Wielder feat loosens this,
  // but isn't referenced anywhere else in this app yet, so it's not
  // modeled here).
  isLight: boolean;
}

export interface WeaponAttackContext {
  slot: WeaponSlot | 'none';
  strScore: string;
  dexScore: string;
  proficiencyBonus: number;
  fightingStyle: string | null;
  // Whether the character has any other weapon equipped at all (any slot) -
  // gates Fighting Style "Dueling".
  hasAnyOtherWeapon: boolean;
  // Whether the main hand specifically has a companion weapon - only then
  // does an 'off'-slot weapon actually count as a bonus-action off-hand
  // attack (otherwise it's just the only weapon equipped, in the off slot).
  hasMainHandCompanion: boolean;
  // Whether the weapon currently equipped in the main hand (if any) has the
  // Light property - see WeaponAttackDamageItem.isLight.
  mainHandWeaponIsLight: boolean;
  // Monk's Martial Arts: DEX stands in for STR (like Finesse) on monk-weapon
  // attacks while unarmored, even without the Finesse property.
  useMonkDex: boolean;
  weaponProficiencies: { categories: WeaponCategory[]; items: string[] };
}

export interface WeaponAttackDamageResult {
  isProficient: boolean;
  attackBonus: number;
  isOffHandAttack: boolean;
  damageModifier: number;
  damageDice: string;
}

// PHB weapon attack/damage math driven by current equip state: proficiency
// bonus only applies when proficient (line up with weaponProficiencies, or
// Monk weapons which always count); Fighting Style "Archery" (+2 attack,
// ranged only); the off-hand (bonus action) attack only exists when both
// equipped weapons are Light, and its ability modifier only helps if
// negative unless "Two-Weapon Fighting" is active; Fighting Style "Dueling"
// (+2 damage, one-handed melee, no other weapon equipped); and a versatile
// weapon's damage die swaps to its two-handed die only when actually
// wielded with both hands.
export function getWeaponAttackAndDamage(
  item: WeaponAttackDamageItem,
  context: WeaponAttackContext
): WeaponAttackDamageResult {
  const attackAbility: WeaponAttackAbility = context.useMonkDex ? 'finesse' : item.attackAbility;
  const abilityMod = getWeaponAbilityModifier(attackAbility, context.strScore, context.dexScore);
  const isTwoHanded = context.slot === 'twoHanded';

  const isProficient =
    context.useMonkDex ||
    (item.weaponCategory != null && context.weaponProficiencies.categories.includes(item.weaponCategory)) ||
    context.weaponProficiencies.items.includes(item.itemProficiencyKey);

  const archeryBonus = context.fightingStyle === 'Archery' && item.isRanged ? 2 : 0;
  const attackBonus = abilityMod + (isProficient ? context.proficiencyBonus : 0) + archeryBonus;

  const isOffHandAttack =
    context.slot === 'off' && context.hasMainHandCompanion && item.isLight && context.mainHandWeaponIsLight;
  const baseDamageMod = isOffHandAttack
    ? context.fightingStyle === 'Two-Weapon Fighting'
      ? abilityMod
      : Math.min(abilityMod, 0)
    : abilityMod;
  const duelingBonus =
    context.fightingStyle === 'Dueling' && !item.isRanged && !isTwoHanded && !context.hasAnyOtherWeapon ? 2 : 0;
  const damageModifier = baseDamageMod + duelingBonus;

  const damageDice = isTwoHanded && item.damageDiceVersatile ? item.damageDiceVersatile : item.damageDice;

  return { isProficient, attackBonus, isOffHandAttack, damageModifier, damageDice };
}
