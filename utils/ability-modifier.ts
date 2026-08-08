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

export function formatSignedModifier(value: number | null): string {
  if (value === null) {
    return '';
  }
  return value > 0 ? `+${value}` : `${value}`;
}

export function getDerivedModifier(score: string, proficient: boolean, proficiencyBonus: number | null): number | null {
  const abilityModifier = getAbilityModifier(score);
  if (abilityModifier === null) {
    return null;
  }
  if (!proficient) {
    return abilityModifier;
  }
  if (proficiencyBonus === null) {
    return null;
  }
  return abilityModifier + proficiencyBonus;
}

export function getPassiveScore(score: string, proficient: boolean, proficiencyBonus: number | null): number {
  const abilityModifier = getAbilityModifier(score) ?? 0;
  const bonus = proficient ? (proficiencyBonus ?? 0) : 0;
  return 10 + abilityModifier + bonus;
}

export function formatPassiveScore(value: number): string {
  return `${value}`;
}
