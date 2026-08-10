import type { AbilityScore } from '@/types/character';

export function getAbilityModifier(score: string): number | null {
  const trimmed = score.trim();
  if (trimmed === '') {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.floor((parsed - 10) / 2);
}

// The wizard-assigned racial bonus is stored apart from the editable base
// score (see types/character.ts's AbilityScore) - this is the total the
// rest of the sheet (modifiers, AC, passive scores, ...) actually uses.
export function getAbilityTotal(ability: AbilityScore): number | null {
  const trimmed = ability.base.trim();
  if (trimmed === '') {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed + ability.racialBonus;
}

export function formatAbilityTotal(ability: AbilityScore): string {
  const total = getAbilityTotal(ability);
  return total === null ? '' : String(total);
}

export function getAbilityModifierFromTotal(ability: AbilityScore): number | null {
  return getAbilityModifier(formatAbilityTotal(ability));
}

export function formatSignedModifier(value: number | null): string {
  if (value === null) {
    return '';
  }
  return value > 0 ? `+${value}` : `${value}`;
}

// 0 = not proficient, 1 = proficient, 2 = proficient with Expertise
// (doubled proficiency bonus, e.g. Rogue's level-1 "Expertise" feature).
export type ProficiencyMultiplier = 0 | 1 | 2;

export function getProficiencyMultiplier(proficient: boolean, expertise: boolean): ProficiencyMultiplier {
  if (!proficient) return 0;
  return expertise ? 2 : 1;
}

export function getDerivedModifier(
  score: string,
  proficiencyMultiplier: ProficiencyMultiplier,
  proficiencyBonus: number | null
): number | null {
  const abilityModifier = getAbilityModifier(score);
  if (abilityModifier === null) {
    return null;
  }
  if (proficiencyMultiplier === 0) {
    return abilityModifier;
  }
  if (proficiencyBonus === null) {
    return null;
  }
  return abilityModifier + proficiencyBonus * proficiencyMultiplier;
}

export function getPassiveScore(
  score: string,
  proficiencyMultiplier: ProficiencyMultiplier,
  proficiencyBonus: number | null
): number {
  const abilityModifier = getAbilityModifier(score) ?? 0;
  const bonus = proficiencyMultiplier > 0 ? (proficiencyBonus ?? 0) * proficiencyMultiplier : 0;
  return 10 + abilityModifier + bonus;
}

export function formatPassiveScore(value: number): string {
  return `${value}`;
}
