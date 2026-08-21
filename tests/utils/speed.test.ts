// Direct unit tests for utils/speed.ts - no DB, pure functions. Speed is
// stored in meters using the pt-BR books' square abstraction (5ft square =
// 1.5m, not the literal 0.3048 feet-to-meters ratio - see the comment on
// feetToMeters itself), and the Monk's Unarmored Movement tiers (PHB p.78)
// are keyed off class level in feet before that same conversion.
import { describe, expect, it } from 'vitest';

import {
  ARMOR_STRENGTH_SPEED_PENALTY_FEET,
  feetToMeters,
  feetToSquares,
  formatSpeed,
  getEffectiveSpeed,
  getMonkUnarmoredMovementBonusMeters,
  getSpeedInSquares,
  isBelowArmorStrengthRequirement,
} from '@/utils/speed';

describe('feetToMeters', () => {
  it('converte usando a abstração de quadrado de 1,5m (não o metro literal)', () => {
    expect(feetToMeters(30)).toBe(9);
    expect(feetToMeters(10)).toBe(3);
  });
});

describe('feetToSquares', () => {
  it('divide por 5 (1 quadrado = 5 pés)', () => {
    expect(feetToSquares(30)).toBe(6);
    expect(feetToSquares(25)).toBe(5);
  });
});

describe('getSpeedInSquares', () => {
  it('retorna null para uma string vazia', () => {
    expect(getSpeedInSquares('')).toBeNull();
    expect(getSpeedInSquares('   ')).toBeNull();
  });

  it('retorna null para um valor não numérico', () => {
    expect(getSpeedInSquares('abc')).toBeNull();
  });

  it('converte metros armazenados para quadrados, arredondando para baixo', () => {
    expect(getSpeedInSquares('9')).toBe(6);
    expect(getSpeedInSquares('10')).toBe(6);
  });
});

describe('formatSpeed', () => {
  it('formata como "Xm / Yq"', () => {
    expect(formatSpeed('9')).toBe('9m / 6q');
  });

  it('retorna string vazia quando o valor é inválido', () => {
    expect(formatSpeed('')).toBe('');
  });
});

describe('getMonkUnarmoredMovementBonusMeters', () => {
  it('não dá bônus antes do nível 2', () => {
    expect(getMonkUnarmoredMovementBonusMeters(1)).toBe(0);
  });

  it('dá +10 pés (3m) do nível 2 ao 5', () => {
    expect(getMonkUnarmoredMovementBonusMeters(2)).toBe(feetToMeters(10));
    expect(getMonkUnarmoredMovementBonusMeters(5)).toBe(feetToMeters(10));
  });

  it('dá +15 pés (4,5m) do nível 6 ao 9', () => {
    expect(getMonkUnarmoredMovementBonusMeters(6)).toBe(feetToMeters(15));
    expect(getMonkUnarmoredMovementBonusMeters(9)).toBe(feetToMeters(15));
  });

  it('dá +20 pés (6m) do nível 10 ao 13', () => {
    expect(getMonkUnarmoredMovementBonusMeters(10)).toBe(feetToMeters(20));
    expect(getMonkUnarmoredMovementBonusMeters(13)).toBe(feetToMeters(20));
  });

  it('dá +25 pés (7,5m) do nível 14 ao 17', () => {
    expect(getMonkUnarmoredMovementBonusMeters(14)).toBe(feetToMeters(25));
    expect(getMonkUnarmoredMovementBonusMeters(17)).toBe(feetToMeters(25));
  });

  it('dá +30 pés (9m) a partir do nível 18', () => {
    expect(getMonkUnarmoredMovementBonusMeters(18)).toBe(feetToMeters(30));
    expect(getMonkUnarmoredMovementBonusMeters(20)).toBe(feetToMeters(30));
  });
});

describe('ARMOR_STRENGTH_SPEED_PENALTY_FEET', () => {
  it('é 10 pés (PHB: armadura abaixo do requisito de Força reduz a velocidade em 10 pés)', () => {
    expect(ARMOR_STRENGTH_SPEED_PENALTY_FEET).toBe(10);
    expect(feetToMeters(ARMOR_STRENGTH_SPEED_PENALTY_FEET)).toBe(3);
  });
});

describe('isBelowArmorStrengthRequirement', () => {
  it('true quando a Força total é menor que o requisito da armadura', () => {
    expect(isBelowArmorStrengthRequirement(10, { strengthRequirement: 13 })).toBe(true);
  });

  it('false quando atinge ou supera o requisito', () => {
    expect(isBelowArmorStrengthRequirement(13, { strengthRequirement: 13 })).toBe(false);
    expect(isBelowArmorStrengthRequirement(15, { strengthRequirement: 13 })).toBe(false);
  });

  it('false quando a armadura não tem requisito de Força, ou não há armadura equipada', () => {
    expect(isBelowArmorStrengthRequirement(1, { strengthRequirement: undefined })).toBe(false);
    expect(isBelowArmorStrengthRequirement(1, undefined)).toBe(false);
  });
});

describe('getEffectiveSpeed', () => {
  it('velocidade base sem bônus nem penalidade', () => {
    expect(getEffectiveSpeed(9, undefined, 10, 0)).toBe(9);
  });

  it('soma o bônus de deslocamento sem armadura do Monge', () => {
    expect(getEffectiveSpeed(9, undefined, 10, feetToMeters(10))).toBe(9 + feetToMeters(10));
  });

  it('subtrai a penalidade de armadura abaixo do requisito de Força', () => {
    const heavyArmor = { strengthRequirement: 15 };
    expect(getEffectiveSpeed(9, heavyArmor, 10, 0)).toBe(9 - feetToMeters(ARMOR_STRENGTH_SPEED_PENALTY_FEET));
  });

  it('sem penalidade quando a Força atinge o requisito', () => {
    const heavyArmor = { strengthRequirement: 15 };
    expect(getEffectiveSpeed(9, heavyArmor, 15, 0)).toBe(9);
  });

  it('nunca fica negativa (piso 0)', () => {
    const heavyArmor = { strengthRequirement: 15 };
    expect(getEffectiveSpeed(1.5, heavyArmor, 1, 0)).toBe(0);
  });
});
