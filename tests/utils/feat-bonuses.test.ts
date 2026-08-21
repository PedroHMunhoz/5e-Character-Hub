// Direct unit tests for utils/feat-bonuses.ts - no DB. Extracted from
// components/character/passive-scores.tsx and character-sheet.tsx so these
// PHB talent bonuses could be unit-tested.
import { describe, expect, it } from 'vitest';

import { getAlertInitiativeBonus, getObservantPassiveBonus } from '@/utils/feat-bonuses';
import type { CharacterFeatState } from '@/types/character';

function feat(englishName: string): CharacterFeatState {
  return { featId: 1, englishName, abilityChoice: null };
}

describe('getObservantPassiveBonus', () => {
  it('PHB p.170: +5 com o talento Observador', () => {
    expect(getObservantPassiveBonus([feat('Observant')])).toBe(5);
  });

  it('0 sem o talento', () => {
    expect(getObservantPassiveBonus([feat('Alert')])).toBe(0);
    expect(getObservantPassiveBonus(undefined)).toBe(0);
    expect(getObservantPassiveBonus([])).toBe(0);
  });
});

describe('getAlertInitiativeBonus', () => {
  it('PHB p.165: +5 com o talento Alerta', () => {
    expect(getAlertInitiativeBonus([feat('Alert')])).toBe(5);
  });

  it('0 sem o talento', () => {
    expect(getAlertInitiativeBonus([feat('Observant')])).toBe(0);
    expect(getAlertInitiativeBonus(undefined)).toBe(0);
  });
});
