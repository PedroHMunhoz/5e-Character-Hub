import type { CharacterFeatState } from '@/types/character';

function hasFeat(feats: CharacterFeatState[] | undefined, englishName: string): boolean {
  return feats?.some((feat) => feat.englishName === englishName) ?? false;
}

// Observant (PHB p.170): "+5 bonus to your passive Wisdom (Perception) and
// passive Intelligence (Investigation) scores".
export function getObservantPassiveBonus(feats: CharacterFeatState[] | undefined): number {
  return hasFeat(feats, 'Observant') ? 5 : 0;
}

// Alert (PHB p.165): "+5 bonus to initiative".
export function getAlertInitiativeBonus(feats: CharacterFeatState[] | undefined): number {
  return hasFeat(feats, 'Alert') ? 5 : 0;
}
