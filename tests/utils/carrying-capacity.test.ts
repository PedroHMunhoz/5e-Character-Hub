// Direct unit tests for utils/carrying-capacity.ts - no DB. Extracted from
// components/character/character-inventory.tsx, previously 100% untested.
import { describe, expect, it } from 'vitest';

import { getCarryingCapacityKg, getTotalCarriedWeightKg } from '@/utils/carrying-capacity';

describe('getCarryingCapacityKg', () => {
  it('PHB: Força x 15 lb, convertida pra kg (1kg ~= 2lb)', () => {
    // FOR 14 -> 14 * 15lb = 210lb -> * 0,5 (regra 1kg~=2lb) = 105kg
    expect(getCarryingCapacityKg(14)).toBe(105);
  });

  it('FOR 0 dá capacidade 0', () => {
    expect(getCarryingCapacityKg(0)).toBe(0);
  });
});

describe('getTotalCarriedWeightKg', () => {
  it('soma o peso dos itens (peso unitário x quantidade)', () => {
    const items = [
      { weightKg: 1, quantity: 2 },
      { weightKg: 5, quantity: 1 },
    ];
    expect(getTotalCarriedWeightKg(items, 0)).toBe(7);
  });

  it('PHB: cada 50 moedas (de qualquer tipo) pesam 1 lb (0,5kg)', () => {
    expect(getTotalCarriedWeightKg([], 50)).toBe(0.5);
    expect(getTotalCarriedWeightKg([], 100)).toBe(1);
  });

  it('combina peso de itens e de moedas', () => {
    expect(getTotalCarriedWeightKg([{ weightKg: 2, quantity: 3 }], 50)).toBe(6.5);
  });

  it('sem itens nem moedas dá 0', () => {
    expect(getTotalCarriedWeightKg([], 0)).toBe(0);
  });
});
