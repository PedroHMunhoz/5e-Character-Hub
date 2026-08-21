// Direct unit tests for utils/spellcasting.ts - no DB, pure functions.
// Only consumed by app/wizard/spells.tsx and character-spells.tsx, never by
// assembleCharacter, so none of these had any coverage (direct or
// indirect) before this file.
import { describe, expect, it } from 'vitest';

import { getPreparedSpellCount, getSpellAttackBonus, getSpellSaveDC, getSpellSlots } from '@/utils/spellcasting';

describe('getSpellSlots - conjurador completo', () => {
  it('nível 1: 2 espaços de 1º círculo, mais nada', () => {
    expect(getSpellSlots('full', 1)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('nível 5: ganha espaços de 3º círculo', () => {
    expect(getSpellSlots('full', 5)).toEqual([4, 3, 2, 0, 0, 0, 0, 0, 0]);
  });

  it('nível 20: todos os 9 círculos com espaços', () => {
    expect(getSpellSlots('full', 20)).toEqual([4, 3, 3, 3, 3, 2, 2, 1, 1]);
  });
});

describe('getSpellSlots - meio-conjurador (Paladino/Patrulheiro)', () => {
  it('nível 1: nenhum espaço ainda', () => {
    expect(getSpellSlots('1/2', 1)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('nível 2: primeiros espaços de magia', () => {
    expect(getSpellSlots('1/2', 2)).toEqual([2, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('nunca ultrapassa o 5º círculo', () => {
    const slots = getSpellSlots('1/2', 20);
    expect(slots.slice(5)).toEqual([0, 0, 0, 0]);
    expect(slots[4]).toBeGreaterThan(0);
  });
});

describe('getSpellSlots - Magia de Pacto do Bruxo', () => {
  it('nível 1: 1 espaço de círculo 1', () => {
    expect(getSpellSlots('pact', 1)).toEqual([1, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('nível 11: 3 espaços, todos no círculo 5 (o círculo do espaço escala, não a quantidade)', () => {
    expect(getSpellSlots('pact', 11)).toEqual([0, 0, 0, 0, 3, 0, 0, 0, 0]);
  });
});

describe('getSpellSlots - progressão desconhecida/não-conjurador', () => {
  it('retorna todos os círculos zerados', () => {
    expect(getSpellSlots(null, 5)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(getSpellSlots('artificer', 5)).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });
});

describe('getSpellSaveDC', () => {
  it('fórmula PHB: 8 + proficiência + modificador de habilidade', () => {
    expect(getSpellSaveDC(2, 3)).toBe(13);
  });
});

describe('getSpellAttackBonus', () => {
  it('fórmula PHB: proficiência + modificador de habilidade', () => {
    expect(getSpellAttackBonus(2, 3)).toBe(5);
  });
});

describe('getPreparedSpellCount', () => {
  it('fórmula PHB: modificador de habilidade + nível de personagem', () => {
    expect(getPreparedSpellCount(3, 5)).toBe(8);
  });

  it('mínimo de 1, mesmo com modificador negativo', () => {
    expect(getPreparedSpellCount(-2, 1)).toBe(1);
  });
});
