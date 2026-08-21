// Direct unit tests for utils/proficiency.ts - no DB, pure functions. Both
// functions are display-layer only (not called by assemble-character.ts),
// so they had zero coverage, direct or indirect, before this file.
import { describe, expect, it } from 'vitest';

import { getCharacterLevel, getProficiencyBonus } from '@/utils/proficiency';
import type { CharacterClass } from '@/types/character';

function classAt(level: string): CharacterClass {
  return { id: '1', name: 'Fighter', level };
}

describe('getCharacterLevel', () => {
  it('retorna o nível de uma única classe', () => {
    expect(getCharacterLevel([classAt('5')])).toBe(5);
  });

  it('soma os níveis de múltiplas classes (multiclasse)', () => {
    expect(getCharacterLevel([classAt('3'), classAt('2')])).toBe(5);
  });

  it('trata níveis inválidos/vazios como 0', () => {
    expect(getCharacterLevel([classAt('')])).toBe(0);
    expect(getCharacterLevel([classAt('abc')])).toBe(0);
  });

  it('lista vazia dá nível 0', () => {
    expect(getCharacterLevel([])).toBe(0);
  });
});

describe('getProficiencyBonus', () => {
  it('retorna null para nível 0 ou negativo (sem personagem ainda)', () => {
    expect(getProficiencyBonus(0)).toBeNull();
    expect(getProficiencyBonus(-1)).toBeNull();
  });

  it('segue a tabela PHB de bônus de proficiência por nível', () => {
    expect(getProficiencyBonus(1)).toBe(2);
    expect(getProficiencyBonus(4)).toBe(2);
    expect(getProficiencyBonus(5)).toBe(3);
    expect(getProficiencyBonus(8)).toBe(3);
    expect(getProficiencyBonus(9)).toBe(4);
    expect(getProficiencyBonus(12)).toBe(4);
    expect(getProficiencyBonus(13)).toBe(5);
    expect(getProficiencyBonus(16)).toBe(5);
    expect(getProficiencyBonus(17)).toBe(6);
    expect(getProficiencyBonus(20)).toBe(6);
  });

  it('nível acima de 20 é limitado a 20 (bônus +6)', () => {
    expect(getProficiencyBonus(25)).toBe(6);
  });
});
