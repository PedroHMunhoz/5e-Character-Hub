// Direct unit tests for utils/armor-class.ts's getArmorClassBreakdown - no
// DB, hand-built EquippedArmorItem fixtures, same "extracted, DB-free"
// shape as tests/wizard/item-purchase.test.ts. Rules exercised here are the
// PHB armor table (p.144-145: light armor uses full DEX, medium caps DEX at
// +2, heavy ignores DEX), Fighting Style "Defense" (PHB p.72), and the
// Unarmored Defense / Draconic Resilience variants already partially
// covered (unarmored-only) by tests/character-creation/level1-phb-matrix.test.ts.
import { describe, expect, it } from 'vitest';

import {
  getArmorClassBreakdown,
  getUnarmoredDefenseRule,
  type EquippedArmorItem,
  type UnarmoredDefenseRule,
} from '@/utils/armor-class';

const leatherArmor: EquippedArmorItem = { name: 'Armadura de Couro', bonus: 1, weightClass: 'light' };
const chainShirt: EquippedArmorItem = { name: 'Camisa de Malha', bonus: 3, weightClass: 'medium' };
const plateArmor: EquippedArmorItem = { name: 'Armadura de Placas', bonus: 8, weightClass: 'heavy' };
const shield: EquippedArmorItem = { name: 'Escudo', bonus: 2 };

describe('getArmorClassBreakdown - sem armadura', () => {
  it('CA = 10 + modificador de Destreza quando nada está equipado', () => {
    const breakdown = getArmorClassBreakdown('16', []);
    expect(breakdown.effectiveDexModifier).toBe(3);
    expect(breakdown.dexCapNote).toBeUndefined();
    expect(breakdown.total).toBe(13);
  });
});

describe('getArmorClassBreakdown - armadura leve', () => {
  it('aplica o modificador de Destreza inteiro', () => {
    const breakdown = getArmorClassBreakdown('16', [leatherArmor]);
    expect(breakdown.effectiveDexModifier).toBe(3);
    expect(breakdown.dexCapNote).toBeUndefined();
    expect(breakdown.total).toBe(10 + 3 + 1);
  });
});

describe('getArmorClassBreakdown - armadura média', () => {
  it('aplica o modificador de Destreza inteiro quando ele não passa de +2', () => {
    const breakdown = getArmorClassBreakdown('12', [chainShirt]);
    expect(breakdown.dexModifier).toBe(1);
    expect(breakdown.effectiveDexModifier).toBe(1);
    expect(breakdown.dexCapNote).toBeUndefined();
    expect(breakdown.total).toBe(10 + 1 + 3);
  });

  it('limita o modificador de Destreza a +2 quando ele é maior', () => {
    const breakdown = getArmorClassBreakdown('18', [chainShirt]);
    expect(breakdown.dexModifier).toBe(4);
    expect(breakdown.effectiveDexModifier).toBe(2);
    expect(breakdown.dexCapNote).toBe('Limitado a +2 (armadura média)');
    expect(breakdown.total).toBe(10 + 2 + 3);
  });
});

describe('getArmorClassBreakdown - armadura pesada', () => {
  it('ignora completamente o modificador de Destreza', () => {
    const breakdown = getArmorClassBreakdown('16', [plateArmor]);
    expect(breakdown.dexModifier).toBe(3);
    expect(breakdown.effectiveDexModifier).toBe(0);
    expect(breakdown.dexCapNote).toBe('Não se aplica (armadura pesada)');
    expect(breakdown.total).toBe(10 + 0 + 8);
  });
});

describe('getArmorClassBreakdown - escudo', () => {
  it('soma o bônus fixo do escudo sem afetar o cap de Destreza', () => {
    const breakdown = getArmorClassBreakdown('14', [shield]);
    expect(breakdown.effectiveDexModifier).toBe(2);
    expect(breakdown.dexCapNote).toBeUndefined();
    expect(breakdown.total).toBe(10 + 2 + 2);
  });

  it('soma junto com uma armadura de corpo equipada', () => {
    const breakdown = getArmorClassBreakdown('16', [leatherArmor, shield]);
    expect(breakdown.total).toBe(10 + 3 + 1 + 2);
  });
});

describe('getArmorClassBreakdown - Estilo de Luta "Defesa"', () => {
  it('soma +1 quando há armadura de corpo equipada', () => {
    const breakdown = getArmorClassBreakdown('16', [leatherArmor], 'Defense');
    expect(breakdown.items).toContainEqual({ name: 'Estilo de Luta: Defesa', bonus: 1 });
    expect(breakdown.total).toBe(10 + 3 + 1 + 1);
  });

  it('não se aplica com apenas um escudo equipado (nenhuma armadura de corpo)', () => {
    const breakdown = getArmorClassBreakdown('16', [shield], 'Defense');
    expect(breakdown.items).not.toContainEqual(expect.objectContaining({ name: 'Estilo de Luta: Defesa' }));
    expect(breakdown.total).toBe(10 + 3 + 2);
  });

  it('não se aplica sem nenhuma armadura equipada', () => {
    const breakdown = getArmorClassBreakdown('16', [], 'Defense');
    expect(breakdown.total).toBe(10 + 3);
  });
});

describe('getArmorClassBreakdown - Defesa sem Armadura (Bárbaro)', () => {
  const barbarianRule: UnarmoredDefenseRule = {
    label: 'Defesa sem Armadura',
    baseAC: 10,
    secondaryAbilityScore: '14',
    requiresNoShield: false,
  };

  it('usa 10 + DES + CON quando desarmado', () => {
    const breakdown = getArmorClassBreakdown('16', [], null, barbarianRule);
    expect(breakdown.total).toBe(10 + 3 + 2);
  });

  it('continua ativa e soma o bônus do escudo, já que Bárbaro não exige mão livre', () => {
    const breakdown = getArmorClassBreakdown('16', [shield], null, barbarianRule);
    expect(breakdown.total).toBe(10 + 3 + 2 + 2);
  });

  it('desliga assim que há armadura de corpo equipada, mesmo com a regra configurada', () => {
    const breakdown = getArmorClassBreakdown('16', [leatherArmor], null, barbarianRule);
    expect(breakdown.items).not.toContainEqual(expect.objectContaining({ name: 'Defesa sem Armadura' }));
    expect(breakdown.total).toBe(10 + 3 + 1);
  });
});

describe('getArmorClassBreakdown - Defesa sem Armadura (Monge)', () => {
  const monkRule: UnarmoredDefenseRule = {
    label: 'Defesa sem Armadura',
    baseAC: 10,
    secondaryAbilityScore: '14',
    requiresNoShield: true,
  };

  it('usa 10 + DES + SAB quando desarmado e sem escudo', () => {
    const breakdown = getArmorClassBreakdown('16', [], null, monkRule);
    expect(breakdown.total).toBe(10 + 3 + 2);
  });

  it('desliga ao equipar um escudo (requiresNoShield), restando só o bônus do próprio escudo', () => {
    const breakdown = getArmorClassBreakdown('16', [shield], null, monkRule);
    expect(breakdown.items).not.toContainEqual(expect.objectContaining({ name: 'Defesa sem Armadura' }));
    expect(breakdown.total).toBe(10 + 3 + 2);
  });
});

describe('getArmorClassBreakdown - Resiliência Dracônica', () => {
  const draconicRule: UnarmoredDefenseRule = {
    label: 'Resiliência Dracônica',
    baseAC: 13,
    requiresNoShield: false,
  };

  it('usa 13 + DES, sem modificador secundário', () => {
    const breakdown = getArmorClassBreakdown('14', [], null, draconicRule);
    expect(breakdown.total).toBe(13 + 2);
  });

  it('desliga assim que há armadura de corpo equipada', () => {
    const breakdown = getArmorClassBreakdown('14', [chainShirt], null, draconicRule);
    expect(breakdown.total).toBe(10 + 2 + 3);
  });
});

describe('getUnarmoredDefenseRule', () => {
  it('Bárbaro: 10 + DES + CON, permite escudo', () => {
    const rule = getUnarmoredDefenseRule('Barbarian', null, { con: '14', wis: '10' });
    expect(rule).toEqual({
      label: 'Defesa sem Armadura',
      baseAC: 10,
      secondaryAbilityScore: '14',
      requiresNoShield: false,
    });
  });

  it('Monge: 10 + DES + SAB, exige mão livre (sem escudo)', () => {
    const rule = getUnarmoredDefenseRule('Monk', null, { con: '10', wis: '16' });
    expect(rule).toEqual({
      label: 'Defesa sem Armadura',
      baseAC: 10,
      secondaryAbilityScore: '16',
      requiresNoShield: true,
    });
  });

  it('Feiticeiro Linhagem Dracônica: base 13 + DES, sem modificador secundário', () => {
    const rule = getUnarmoredDefenseRule('Sorcerer', 'Draconic', { con: '10', wis: '10' });
    expect(rule).toEqual({ label: 'Resiliência Dracônica', baseAC: 13, requiresNoShield: false });
  });

  it('nenhuma classe/subclasse com Defesa sem Armadura: undefined', () => {
    expect(getUnarmoredDefenseRule('Fighter', null, { con: '10', wis: '10' })).toBeUndefined();
    expect(getUnarmoredDefenseRule(null, null, { con: '10', wis: '10' })).toBeUndefined();
  });
});
