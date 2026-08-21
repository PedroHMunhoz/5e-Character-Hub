// Direct unit tests for data/wizard/race-ability-bonus.ts - no DB, hand-
// built RaceAbilityBonus fixtures. combineAbilityBonuses/getResolvedRacialBonus
// already have indirect/integration coverage via
// tests/character-creation/level1-phb-matrix.test.ts (through a fully-
// assembled character's final ability totals), but neither had a dedicated
// unit test exercising its own edge cases (subrace layering, multiple
// choose clauses) directly.
import { describe, expect, it } from 'vitest';

import { combineAbilityBonuses, getResolvedRacialBonus } from '@/data/wizard/race-ability-bonus';
import type { RaceAbilityBonus } from '@/types/reference';

describe('combineAbilityBonuses', () => {
  it('bônus fixo apenas (ex. Draconato: +2 FOR, +1 CAR)', () => {
    const dragonborn: RaceAbilityBonus[] = [{ str: 2, cha: 1 }];
    const combined = combineAbilityBonuses(dragonborn, null);
    expect(combined.fixed).toEqual({ str: 2, cha: 1 });
    expect(combined.choices).toEqual([]);
  });

  it('cláusula de escolha apenas (ex. Meio-Elfo: +2 CAR fixo, +1 em 2 à escolha)', () => {
    const halfElf: RaceAbilityBonus[] = [{ cha: 2, choose: { from: ['str', 'dex', 'con', 'int', 'wis'], count: 2 } }];
    const combined = combineAbilityBonuses(halfElf, null);
    expect(combined.fixed).toEqual({ cha: 2 });
    expect(combined.choices).toEqual([{ from: ['str', 'dex', 'con', 'int', 'wis'], count: 2 }]);
  });

  it('sub-raça soma em cima da raça (ex. Elfo +2 DES, sub-raça Alto Elfo +1 INT)', () => {
    const elf: RaceAbilityBonus[] = [{ dex: 2 }];
    const highElf: RaceAbilityBonus[] = [{ int: 1 }];
    const combined = combineAbilityBonuses(elf, highElf);
    expect(combined.fixed).toEqual({ dex: 2, int: 1 });
  });

  it('raça e sub-raça no mesmo atributo se somam (não substituem)', () => {
    const race: RaceAbilityBonus[] = [{ con: 1 }];
    const subrace: RaceAbilityBonus[] = [{ con: 1 }];
    const combined = combineAbilityBonuses(race, subrace);
    expect(combined.fixed).toEqual({ con: 2 });
  });

  it('sem bônus de raça nem sub-raça: tudo vazio', () => {
    const combined = combineAbilityBonuses(null, null);
    expect(combined.fixed).toEqual({});
    expect(combined.choices).toEqual([]);
  });
});

describe('getResolvedRacialBonus', () => {
  it('soma o bônus fixo com o que o jogador escolheu pra aquela habilidade', () => {
    const combined = combineAbilityBonuses([{ cha: 2, choose: { from: ['str', 'dex'], count: 1 } }], null);
    expect(getResolvedRacialBonus(combined, { dex: 1 }, 'dex')).toBe(1);
    expect(getResolvedRacialBonus(combined, { dex: 1 }, 'cha')).toBe(2);
  });

  it('habilidade sem bônus fixo nem escolha retorna 0', () => {
    const combined = combineAbilityBonuses([{ str: 2 }], null);
    expect(getResolvedRacialBonus(combined, {}, 'wis')).toBe(0);
  });
});
