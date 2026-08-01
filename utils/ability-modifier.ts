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
  return value >= 0 ? `+${value}` : `${value}`;
}

function parsePositiveBonus(value: string): number {
  const trimmed = value.trim().replace(/^\+/, '');
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function getDerivedModifier(
  score: string,
  proficient: boolean,
  proficiencyBonus: string
): number | null {
  const abilityModifier = getAbilityModifier(score);
  if (abilityModifier === null) {
    return null;
  }
  const bonus = proficient ? parsePositiveBonus(proficiencyBonus) : 0;
  return abilityModifier + bonus;
}

export function getPassiveScore(
  score: string,
  proficient: boolean,
  proficiencyBonus: string
): number | null {
  const modifier = getDerivedModifier(score, proficient, proficiencyBonus);
  return modifier === null ? null : 10 + modifier;
}

export function formatPassiveScore(value: number | null): string {
  return value === null ? '' : `${value}`;
}
