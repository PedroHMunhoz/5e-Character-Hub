import type { CharacterClass } from '@/types/character';

export function getCharacterLevel(classes: CharacterClass[]): number {
  return classes.reduce((total, characterClass) => total + (parseInt(characterClass.level, 10) || 0), 0);
}

export function getProficiencyBonus(characterLevel: number): number | null {
  if (characterLevel <= 0) {
    return null;
  }
  return 2 + Math.floor((Math.min(characterLevel, 20) - 1) / 4);
}
