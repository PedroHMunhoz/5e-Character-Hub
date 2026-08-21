// Direct unit tests for utils/dice.ts - no DB. Math.random is mocked for
// determinism (these are randomness-driven, which is presumably why they
// were never unit-tested before, but the drop-lowest/summing logic and the
// gold-formula parsing are still deterministic given a fixed die sequence).
import { afterEach, describe, expect, it, vi } from 'vitest';

import { roll4d6DropLowest, rollAbilityScoreSet, rollGoldFormula } from '@/utils/dice';

// rollDie does Math.floor(Math.random() * faces) + 1 - queues up a fixed
// sequence of Math.random() return values (each in [0,1)) so successive
// die rolls come out to the given 1-indexed face values.
function mockRolls(faces: number, values: number[]) {
  const randoms = values.map((value) => (value - 1) / faces);
  const spy = vi.spyOn(Math, 'random');
  for (const value of randoms) spy.mockImplementationOnce(() => value);
  return spy;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('roll4d6DropLowest', () => {
  it('descarta o menor dos 4 d6 e soma os outros 3', () => {
    mockRolls(6, [2, 6, 1, 4]);
    // ordenado: [1, 2, 4, 6] -> descarta o 1, soma 2 + 4 + 6
    expect(roll4d6DropLowest()).toBe(12);
  });

  it('todos os dados iguais: soma os 3 mantidos normalmente', () => {
    mockRolls(6, [3, 3, 3, 3]);
    expect(roll4d6DropLowest()).toBe(9);
  });
});

describe('rollAbilityScoreSet', () => {
  it('gera 6 valores', () => {
    const scores = rollAbilityScoreSet();
    expect(scores).toHaveLength(6);
    for (const score of scores) {
      expect(score).toBeGreaterThanOrEqual(3);
      expect(score).toBeLessThanOrEqual(18);
    }
  });
});

describe('rollGoldFormula', () => {
  it('rola NdM e multiplica pelo fator, ex. "5d4 × 10" (Guerreiro)', () => {
    mockRolls(4, [2, 3, 1, 4, 2]);
    expect(rollGoldFormula('5d4 × 10')).toBe((2 + 3 + 1 + 4 + 2) * 10);
  });

  it('sem multiplicador, ex. "5d4" (Monge)', () => {
    mockRolls(4, [1, 1, 1, 1, 1]);
    expect(rollGoldFormula('5d4')).toBe(5);
  });

  it('aceita o "x" ascii além do "×" tipográfico', () => {
    mockRolls(4, [4, 4]);
    expect(rollGoldFormula('2d4 x 5')).toBe(8 * 5);
  });

  it('fórmula não reconhecida retorna 0', () => {
    expect(rollGoldFormula('nada aqui')).toBe(0);
  });
});
