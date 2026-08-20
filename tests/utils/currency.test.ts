// Direct unit tests for utils/currency.ts - no DB, pure conversion math.
import { describe, expect, it } from 'vitest';

import { breakdownCp, formatCurrencyBreakdown } from '@/utils/currency';

describe('breakdownCp', () => {
  it('divide em PO (100cp)/PP (10cp)/PC (1cp) sem sobra', () => {
    expect(breakdownCp(496)).toEqual({ po: 4, pp: 9, pc: 6 });
  });

  it('valor exato em peças de ouro não gera PP/PC', () => {
    expect(breakdownCp(200)).toEqual({ po: 2, pp: 0, pc: 0 });
  });

  it('valor menor que 1 PO só usa PP/PC (ex.: pacote de balas de funda, 4pc)', () => {
    expect(breakdownCp(4)).toEqual({ po: 0, pp: 0, pc: 4 });
  });

  it('zero cp', () => {
    expect(breakdownCp(0)).toEqual({ po: 0, pp: 0, pc: 0 });
  });
});

describe('formatCurrencyBreakdown', () => {
  it('mostra só as denominações não-zero, na ordem PO, PP, PC', () => {
    expect(formatCurrencyBreakdown(496)).toBe('4 PO, 9 PP, 6 PC');
  });

  it('omite PP quando zero', () => {
    expect(formatCurrencyBreakdown(206)).toBe('2 PO, 6 PC');
  });

  it('omite PC quando zero', () => {
    expect(formatCurrencyBreakdown(290)).toBe('2 PO, 9 PP');
  });

  it('valor redondo em PO mostra só PO', () => {
    expect(formatCurrencyBreakdown(200)).toBe('2 PO');
  });

  it('valor zero cai no fallback "0 PC"', () => {
    expect(formatCurrencyBreakdown(0)).toBe('0 PC');
  });
});
