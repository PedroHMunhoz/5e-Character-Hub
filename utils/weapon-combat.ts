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
