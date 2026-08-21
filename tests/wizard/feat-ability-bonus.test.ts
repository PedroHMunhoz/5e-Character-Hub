// Direct unit tests for data/wizard/feat-ability-bonus.ts - no DB. Only
// incidentally exercised before this file (called by tests/support/build-
// test-draft.ts to shape fixtures, never asserted on its own return value).
import { describe, expect, it } from 'vitest';

import { getFeatAbilityBonuses, getFeatAbilityChoice } from '@/data/wizard/feat-ability-bonus';

describe('getFeatAbilityBonuses', () => {
  it('bônus fixo apenas (ex. Ator: +1 CAR)', () => {
    const result = getFeatAbilityBonuses([{ cha: 1 }]);
    expect(result.fixed).toEqual({ cha: 1 });
    expect(result.choice).toBeNull();
  });

  it('cláusula de escolha apenas (ex. Atleta: +1 em FOR ou DES, à escolha)', () => {
    const result = getFeatAbilityBonuses([{ choose: { from: ['str', 'dex'], amount: 1 } }]);
    expect(result.fixed).toEqual({});
    expect(result.choice).toEqual({ from: ['str', 'dex'], count: 1 });
  });

  it('null/ausente retorna vazio', () => {
    const result = getFeatAbilityBonuses(null);
    expect(result.fixed).toEqual({});
    expect(result.choice).toBeNull();
  });

  it('mais de um grupo com choose: só o primeiro vale', () => {
    const result = getFeatAbilityBonuses([
      { choose: { from: ['str'], amount: 1 } },
      { choose: { from: ['dex'], amount: 1 } },
    ]);
    expect(result.choice).toEqual({ from: ['str'], count: 1 });
  });
});

describe('getFeatAbilityChoice', () => {
  it('retorna só a cláusula de escolha, ignorando o fixo', () => {
    expect(getFeatAbilityChoice([{ choose: { from: ['str', 'dex'], amount: 1 } }])).toEqual({
      from: ['str', 'dex'],
      count: 1,
    });
  });

  it('retorna null quando o talento não tem escolha de habilidade', () => {
    expect(getFeatAbilityChoice([{ str: 1 }])).toBeNull();
    expect(getFeatAbilityChoice(null)).toBeNull();
  });
});
