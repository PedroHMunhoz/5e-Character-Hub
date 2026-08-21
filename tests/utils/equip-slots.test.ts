// Direct unit tests for utils/equip-slots.ts - no DB, hand-built
// InventoryItemState fixtures, same "extracted, DB-free" shape as
// tests/wizard/item-purchase.test.ts. This module is the equip-slot state
// machine behind the sheet's "click to equip" flows in
// context/character-context.tsx: which hand a weapon goes into, when
// equipping is blocked outright vs. needs confirmation (because a shield is
// in the way), and the shield <-> off-hand-weapon interactions (equipping
// one drops/relocates the other) - none of which are spelled out in the
// PHB as a single rule, but all follow from "you have two hands and a
// two-handed grip or a shield needs one of them free".
import { describe, expect, it } from 'vitest';

import {
  findEquippedShieldId,
  isHandOccupied,
  resolveArmorEquipToggle,
  resolveWeaponEquipToggle,
  shieldToDropForWeaponSlot,
  weaponSlotsConflict,
} from '@/utils/equip-slots';
import type { CharacterSheet } from '@/types/character';

type InventoryItems = CharacterSheet['inventoryItems'];

function inventory(items: Record<string, Partial<InventoryItems[string]>>): InventoryItems {
  return Object.fromEntries(Object.entries(items).map(([id, state]) => [id, { itemId: id, quantity: '1', ...state }]));
}

describe('weaponSlotsConflict', () => {
  it('não conflita quando não há slot existente', () => {
    expect(weaponSlotsConflict(undefined, 'main')).toBe(false);
  });

  it('conflita quando é o mesmo slot', () => {
    expect(weaponSlotsConflict('main', 'main')).toBe(true);
    expect(weaponSlotsConflict('off', 'off')).toBe(true);
  });

  it('não conflita entre mãos diferentes', () => {
    expect(weaponSlotsConflict('main', 'off')).toBe(false);
  });

  it('uma arma de duas mãos conflita com qualquer mão, nos dois sentidos', () => {
    expect(weaponSlotsConflict('twoHanded', 'main')).toBe(true);
    expect(weaponSlotsConflict('main', 'twoHanded')).toBe(true);
  });
});

describe('isHandOccupied / findEquippedShieldId', () => {
  it('detecta a mão ocupada diretamente e via arma de duas mãos', () => {
    const items = inventory({ sword: { weaponSlot: 'main' }, greatsword: { weaponSlot: 'twoHanded' } });
    expect(isHandOccupied(items, 'main', 'greatsword')).toBe(true);
    expect(isHandOccupied(items, 'off', 'sword')).toBe(true);
  });

  it('ignora o próprio item ao checar ocupação (excludeId)', () => {
    const items = inventory({ sword: { weaponSlot: 'main' } });
    expect(isHandOccupied(items, 'main', 'sword')).toBe(false);
  });

  it('encontra o escudo equipado, ignorando o excludeId', () => {
    const items = inventory({ shield: { armorSlot: 'shield' }, other: { armorSlot: 'shield' } });
    expect(findEquippedShieldId(items)).toBeDefined();
    expect(findEquippedShieldId(items, 'shield')).toBe('other');
  });
});

describe('resolveWeaponEquipToggle', () => {
  it('desequipa uma arma que já está equipada', () => {
    const items = inventory({ sword: { weaponSlot: 'main' } });
    expect(resolveWeaponEquipToggle(items, 'sword', 'oneHanded')).toEqual({ kind: 'applied', slot: 'none' });
  });

  it('equipa uma arma de uma mão na mão principal quando ela está livre', () => {
    const items = inventory({ sword: {} });
    expect(resolveWeaponEquipToggle(items, 'sword', 'oneHanded')).toEqual({ kind: 'applied', slot: 'main' });
  });

  it('equipa na mão secundária quando a principal já está ocupada', () => {
    const items = inventory({ sword: { weaponSlot: 'main' }, dagger: {} });
    expect(resolveWeaponEquipToggle(items, 'dagger', 'oneHanded')).toEqual({ kind: 'applied', slot: 'off' });
  });

  it('bloqueia equipar uma arma de uma mão quando as duas mãos já estão ocupadas', () => {
    const items = inventory({ sword: { weaponSlot: 'main' }, axe: { weaponSlot: 'off' }, dagger: {} });
    expect(resolveWeaponEquipToggle(items, 'dagger', 'oneHanded')).toEqual({
      kind: 'blocked',
      message: 'Desequipe uma arma antes de equipar esta.',
    });
  });

  it('bloqueia equipar uma arma de duas mãos se qualquer mão estiver ocupada', () => {
    const items = inventory({ sword: { weaponSlot: 'main' }, greatsword: {} });
    expect(resolveWeaponEquipToggle(items, 'greatsword', 'twoHanded')).toEqual({
      kind: 'blocked',
      message: 'Desequipe uma arma antes de equipar esta arma de duas mãos.',
    });
  });

  it('pede confirmação (não aplica direto) ao equipar arma de duas mãos com um escudo equipado', () => {
    const items = inventory({ shield: { armorSlot: 'shield' }, greatsword: {} });
    expect(resolveWeaponEquipToggle(items, 'greatsword', 'twoHanded')).toEqual({
      kind: 'confirmShieldUnequip',
      slot: 'twoHanded',
    });
  });

  it('equipa arma de duas mãos direto quando as mãos estão livres e não há escudo', () => {
    const items = inventory({ greatsword: {} });
    expect(resolveWeaponEquipToggle(items, 'greatsword', 'twoHanded')).toEqual({
      kind: 'applied',
      slot: 'twoHanded',
    });
  });

  it('pede confirmação ao equipar na mão secundária com um escudo equipado', () => {
    // Mão principal já ocupada por outra arma - só assim o dagger cai no
    // caminho da mão secundária, onde o escudo está no caminho.
    const items = inventory({ shield: { armorSlot: 'shield' }, sword: { weaponSlot: 'main' }, dagger: {} });
    expect(resolveWeaponEquipToggle(items, 'dagger', 'oneHanded')).toEqual({
      kind: 'confirmShieldUnequip',
      slot: 'off',
    });
  });

  it('uma arma versátil segue as mesmas regras de uma mão quando não for para "twoHanded"', () => {
    const items = inventory({ longsword: {} });
    expect(resolveWeaponEquipToggle(items, 'longsword', 'versatile')).toEqual({ kind: 'applied', slot: 'main' });
  });
});

describe('resolveArmorEquipToggle', () => {
  it('desequipa uma armadura/escudo que já está equipado', () => {
    const items = inventory({ armor: { armorSlot: 'body' } });
    expect(resolveArmorEquipToggle(items, 'armor', 'body')).toEqual({ kind: 'applied', slot: 'none' });
  });

  it('equipar uma segunda armadura de corpo bloqueia enquanto a primeira estiver equipada', () => {
    const items = inventory({ leather: { armorSlot: 'body' }, plate: {} });
    expect(resolveArmorEquipToggle(items, 'plate', 'body')).toEqual({
      kind: 'blocked',
      message: 'Desequipe a armadura atual antes de equipar esta.',
    });
  });

  it('equipar um segundo escudo bloqueia enquanto o primeiro estiver equipado', () => {
    const items = inventory({ shieldA: { armorSlot: 'shield' }, shieldB: {} });
    expect(resolveArmorEquipToggle(items, 'shieldB', 'shield')).toEqual({
      kind: 'blocked',
      message: 'Desequipe o escudo atual antes de equipar este.',
    });
  });

  it('equipa o escudo direto quando a mão secundária está livre', () => {
    const items = inventory({ shield: {} });
    expect(resolveArmorEquipToggle(items, 'shield', 'shield')).toEqual({ kind: 'applied', slot: 'shield' });
  });

  it('realoca uma arma de uma mão da secundária para a principal ao equipar um escudo', () => {
    const items = inventory({ dagger: { weaponSlot: 'off' }, shield: {} });
    expect(resolveArmorEquipToggle(items, 'shield', 'shield')).toEqual({
      kind: 'applied',
      slot: 'shield',
      autoShiftOffHandWeaponId: 'dagger',
    });
  });

  it('bloqueia equipar um escudo se a secundária está ocupada e a principal também', () => {
    const items = inventory({
      sword: { weaponSlot: 'main' },
      dagger: { weaponSlot: 'off' },
      shield: {},
    });
    expect(resolveArmorEquipToggle(items, 'shield', 'shield')).toEqual({
      kind: 'blocked',
      message: 'Sua mão secundária precisa estar livre para equipar um escudo.',
    });
  });

  it('bloqueia equipar um escudo se a secundária está ocupada por uma arma de duas mãos (não dá pra realocar)', () => {
    const items = inventory({ greatsword: { weaponSlot: 'twoHanded' }, shield: {} });
    expect(resolveArmorEquipToggle(items, 'shield', 'shield')).toEqual({
      kind: 'blocked',
      message: 'Sua mão secundária precisa estar livre para equipar um escudo.',
    });
  });
});

describe('shieldToDropForWeaponSlot', () => {
  it('desequipa o escudo ao equipar uma arma na mão secundária', () => {
    const items = inventory({ shield: { armorSlot: 'shield' }, dagger: {} });
    expect(shieldToDropForWeaponSlot(items, 'dagger', 'off')).toBe('shield');
  });

  it('desequipa o escudo ao equipar uma arma de duas mãos', () => {
    const items = inventory({ shield: { armorSlot: 'shield' }, greatsword: {} });
    expect(shieldToDropForWeaponSlot(items, 'greatsword', 'twoHanded')).toBe('shield');
  });

  it('não mexe no escudo ao equipar na mão principal', () => {
    const items = inventory({ shield: { armorSlot: 'shield' }, sword: {} });
    expect(shieldToDropForWeaponSlot(items, 'sword', 'main')).toBeUndefined();
  });

  it('não retorna nada se não há escudo equipado', () => {
    const items = inventory({ dagger: {} });
    expect(shieldToDropForWeaponSlot(items, 'dagger', 'off')).toBeUndefined();
  });
});
