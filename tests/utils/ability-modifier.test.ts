// Direct unit tests for utils/ability-modifier.ts - no DB, pure functions.
// getAbilityTotal/getAbilityModifierFromTotal already have indirect
// coverage via tests/character-creation/level1-phb-matrix.test.ts (through
// a fully-assembled character), but getProficiencyMultiplier,
// getDerivedModifier, and getPassiveScore had zero coverage anywhere.
import { describe, expect, it } from 'vitest';

import {
  formatAbilityTotal,
  formatPassiveScore,
  formatSignedModifier,
  getAbilityModifier,
  getAbilityModifierFromTotal,
  getAbilityTotal,
  getDerivedModifier,
  getPassiveScore,
  getProficiencyMultiplier,
} from '@/utils/ability-modifier';
import type { AbilityScore } from '@/types/character';

describe('getAbilityModifier', () => {
  it('aplica a fórmula PHB floor((score-10)/2)', () => {
    expect(getAbilityModifier('10')).toBe(0);
    expect(getAbilityModifier('16')).toBe(3);
    expect(getAbilityModifier('8')).toBe(-1);
    expect(getAbilityModifier('7')).toBe(-2);
  });

  it('retorna null para string vazia ou não numérica', () => {
    expect(getAbilityModifier('')).toBeNull();
    expect(getAbilityModifier('abc')).toBeNull();
  });
});

describe('getAbilityTotal', () => {
  it('soma base + bônus racial + bônus de talento', () => {
    const ability: AbilityScore = { base: '14', racialBonus: 2, featBonus: 1 };
    expect(getAbilityTotal(ability)).toBe(17);
  });

  it('trata featBonus ausente como 0 (personagens criados antes de talentos existirem)', () => {
    const ability: AbilityScore = { base: '14', racialBonus: 2 };
    expect(getAbilityTotal(ability)).toBe(16);
  });

  it('retorna null para base vazia', () => {
    const ability: AbilityScore = { base: '', racialBonus: 0 };
    expect(getAbilityTotal(ability)).toBeNull();
  });
});

describe('formatAbilityTotal / getAbilityModifierFromTotal', () => {
  it('formata o total como string e deriva o modificador a partir dele', () => {
    const ability: AbilityScore = { base: '15', racialBonus: 1 };
    expect(formatAbilityTotal(ability)).toBe('16');
    expect(getAbilityModifierFromTotal(ability)).toBe(3);
  });
});

describe('formatSignedModifier', () => {
  it('prefixa positivos com + e mantém negativos como estão', () => {
    expect(formatSignedModifier(3)).toBe('+3');
    expect(formatSignedModifier(0)).toBe('0');
    expect(formatSignedModifier(-2)).toBe('-2');
  });

  it('retorna string vazia para null', () => {
    expect(formatSignedModifier(null)).toBe('');
  });
});

describe('getProficiencyMultiplier', () => {
  it('0 quando não proficiente', () => {
    expect(getProficiencyMultiplier(false, false)).toBe(0);
  });

  it('1 quando proficiente sem Especialização', () => {
    expect(getProficiencyMultiplier(true, false)).toBe(1);
  });

  it('2 (dobra) quando proficiente com Especialização', () => {
    expect(getProficiencyMultiplier(true, true)).toBe(2);
  });

  it('Especialização sem proficiência não conta (expertise só é relevante se proficient)', () => {
    expect(getProficiencyMultiplier(false, true)).toBe(0);
  });
});

describe('getDerivedModifier', () => {
  it('sem proficiência, é só o modificador de habilidade', () => {
    expect(getDerivedModifier('16', 0, 2)).toBe(3);
  });

  it('com proficiência, soma o bônus de proficiência uma vez', () => {
    expect(getDerivedModifier('16', 1, 2)).toBe(5);
  });

  it('com Especialização, dobra o bônus de proficiência', () => {
    expect(getDerivedModifier('16', 2, 2)).toBe(7);
  });

  it('retorna null se o score for inválido', () => {
    expect(getDerivedModifier('', 1, 2)).toBeNull();
  });

  it('retorna null se precisar do bônus de proficiência mas ele não estiver disponível', () => {
    expect(getDerivedModifier('16', 1, null)).toBeNull();
  });
});

describe('getPassiveScore', () => {
  it('fórmula PHB: 10 + modificador de habilidade', () => {
    expect(getPassiveScore('16', 0, 2)).toBe(13);
  });

  it('soma o bônus de proficiência quando proficiente', () => {
    expect(getPassiveScore('16', 1, 2)).toBe(15);
  });

  it('dobra o bônus de proficiência com Especialização', () => {
    expect(getPassiveScore('16', 2, 2)).toBe(17);
  });

  it('trata score inválido como modificador 0, não null (sempre retorna um número)', () => {
    expect(getPassiveScore('', 0, 2)).toBe(10);
  });
});

describe('formatPassiveScore', () => {
  it('formata como string', () => {
    expect(formatPassiveScore(15)).toBe('15');
  });
});
