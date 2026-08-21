// Direct unit tests for utils/hit-points.ts - no DB. Extracted from
// components/character/manage-hp-modal.tsx's handleApply, previously
// entirely untested despite encoding several PHB rules: temporary HP
// absorbs damage before current HP (p.198), healing can't exceed HP
// maximum (p.198), and the massive-damage instant-death rule (p.197).
import { describe, expect, it } from 'vitest';

import { resolveHpApply } from '@/utils/hit-points';

describe('resolveHpApply - variant "temp-only"', () => {
  it('só troca o PV temporário, ignora PV atual e o teto de PV máximo', () => {
    const result = resolveHpApply('temp-only', 7, 5, 0, 10);
    expect(result).toEqual({ kind: 'applied', result: { current: '5', temporary: '7' }, outcome: null });
  });
});

describe('resolveHpApply - dano absorvido pelo PV temporário', () => {
  it('dano menor que o PV temporário: só reduz o temporário, PV atual intacto', () => {
    // Atual 10, Temp 5 (total 15); aplica -3 -> valor final 12.
    const result = resolveHpApply('damage-heal', 12, 10, 5, 10);
    expect(result).toEqual({
      kind: 'applied',
      result: { current: '10', temporary: '2' },
      outcome: null,
    });
  });

  it('dano maior que o PV temporário: zera o temporário e o restante reduz o atual', () => {
    // Atual 10, Temp 3 (total 13); aplica -8 -> valor final 5.
    const result = resolveHpApply('damage-heal', 5, 10, 3, 20);
    expect(result).toEqual({
      kind: 'applied',
      result: { current: '5', temporary: '0' },
      outcome: null,
    });
  });
});

describe('resolveHpApply - cura respeitando o teto de PV máximo', () => {
  it('cura até o máximo exatamente', () => {
    const result = resolveHpApply('damage-heal', 10, 8, 0, 10);
    expect(result).toEqual({ kind: 'applied', result: { current: '10', temporary: '0' }, outcome: null });
  });

  it('valor acima do teto (PV máximo + temporário) é inválido, nada é aplicado', () => {
    const result = resolveHpApply('damage-heal', 11, 8, 0, 10);
    expect(result).toEqual({ kind: 'invalid', message: 'Esse valor é inválido pois PV Máximo é 10.' });
  });
});

describe('resolveHpApply - chegar a 0', () => {
  it('inconsciente quando o dano restante é menor que o PV máximo', () => {
    // Atual 5, Temp 0; aplica -5 -> valor final 0, restante 0, sem overflow.
    const result = resolveHpApply('damage-heal', 0, 5, 0, 20);
    expect(result.kind).toBe('applied');
    if (result.kind !== 'applied') throw new Error('unreachable');
    expect(result.result).toEqual({ current: '0', temporary: '0' });
    expect(result.outcome).toEqual({
      title: 'Inconsciente',
      message: 'Os pontos de vida chegaram a 0. O personagem está inconsciente.',
    });
  });

  it('morte por dano maciço quando o dano restante é igual ou maior que o PV máximo', () => {
    // Atual 5, Temp 0; aplica -25 -> restante após zerar o atual é 20 (>= PV máximo 10).
    const result = resolveHpApply('damage-heal', -20, 5, 0, 10);
    expect(result.kind).toBe('applied');
    if (result.kind !== 'applied') throw new Error('unreachable');
    expect(result.result).toEqual({ current: '0', temporary: '0' });
    expect(result.outcome).toEqual({
      title: 'Morte por Dano Maciço',
      message:
        'O dano restante foi igual ou maior que o máximo de pontos de vida do personagem. Ele morreu instantaneamente.',
    });
  });
});

describe('resolveHpApply - PV máximo 0 (ficha sem PV configurado)', () => {
  it('não valida teto nem limita a cura', () => {
    const result = resolveHpApply('damage-heal', 100, 5, 0, 0);
    expect(result).toEqual({ kind: 'applied', result: { current: '100', temporary: '0' }, outcome: null });
  });
});
