import type { WeaponHandedness } from '@/constants/item-codes';
import type { ArmorSlot, CharacterSheet, WeaponSlot } from '@/types/character';

type InventoryItems = CharacterSheet['inventoryItems'];

export type WeaponEquipResolution =
  | { kind: 'applied'; slot: WeaponSlot | 'none' }
  | { kind: 'blocked'; message: string }
  | { kind: 'confirmShieldUnequip'; slot: WeaponSlot };

export type ArmorEquipResolution =
  | { kind: 'applied'; slot: ArmorSlot | 'none'; autoShiftOffHandWeaponId?: string }
  | { kind: 'blocked'; message: string };

// Two weapon slots conflict (only one weapon can occupy them at once) when
// they're the same slot, or either one is 'twoHanded' - a two-handed grip
// occupies both the main and off hand.
export function weaponSlotsConflict(existingSlot: WeaponSlot | undefined, newSlot: WeaponSlot): boolean {
  if (!existingSlot) return false;
  return existingSlot === newSlot || existingSlot === 'twoHanded' || newSlot === 'twoHanded';
}

// A two-handed weapon occupies both hands, so it counts as occupying
// whichever single hand is being checked.
export function isHandOccupied(inventoryItems: InventoryItems, hand: 'main' | 'off', excludeId?: string): boolean {
  return Object.entries(inventoryItems).some(
    ([itemId, itemState]) =>
      itemId !== excludeId && (itemState.weaponSlot === hand || itemState.weaponSlot === 'twoHanded')
  );
}

export function findEquippedShieldId(inventoryItems: InventoryItems, excludeId?: string): string | undefined {
  const entry = Object.entries(inventoryItems).find(
    ([itemId, itemState]) => itemId !== excludeId && itemState.armorSlot === 'shield'
  );
  return entry?.[0];
}

// A shield needs a free off-hand - equipping a weapon into 'off' or
// 'twoHanded' silently drops whatever shield is currently equipped. Returns
// the shield's inventory id to unequip, if any.
export function shieldToDropForWeaponSlot(
  inventoryItems: InventoryItems,
  id: string,
  slot: WeaponSlot | 'none'
): string | undefined {
  if (slot !== 'off' && slot !== 'twoHanded') return undefined;
  return findEquippedShieldId(inventoryItems, id);
}

// The inventory list's "click to equip" entry point: fills the main hand
// first, then the off hand, blocks when both hands are occupied, and asks
// for confirmation (rather than silently unequipping) when a shield is in
// the way instead of an empty hand.
export function resolveWeaponEquipToggle(
  inventoryItems: InventoryItems,
  id: string,
  handedness: WeaponHandedness
): WeaponEquipResolution {
  if (inventoryItems[id]?.weaponSlot) {
    return { kind: 'applied', slot: 'none' };
  }

  const mainOccupied = isHandOccupied(inventoryItems, 'main', id);
  const offOccupied = isHandOccupied(inventoryItems, 'off', id);

  if (handedness === 'twoHanded') {
    if (mainOccupied || offOccupied) {
      return { kind: 'blocked', message: 'Desequipe uma arma antes de equipar esta arma de duas mãos.' };
    }
    if (findEquippedShieldId(inventoryItems, id)) {
      return { kind: 'confirmShieldUnequip', slot: 'twoHanded' };
    }
    return { kind: 'applied', slot: 'twoHanded' };
  }

  if (!mainOccupied) {
    return { kind: 'applied', slot: 'main' };
  }
  if (!offOccupied) {
    if (findEquippedShieldId(inventoryItems, id)) {
      return { kind: 'confirmShieldUnequip', slot: 'off' };
    }
    return { kind: 'applied', slot: 'off' };
  }
  return { kind: 'blocked', message: 'Desequipe uma arma antes de equipar esta.' };
}

// The inventory list's "click to equip" entry point for armor/shields. A
// shield equip with a one-handed weapon in the off hand tries to shift that
// weapon to the main hand first (sparing a manual re-equip) rather than
// blocking outright, but only when the main hand is actually free to
// receive it.
export function resolveArmorEquipToggle(
  inventoryItems: InventoryItems,
  id: string,
  slotKind: ArmorSlot
): ArmorEquipResolution {
  if (inventoryItems[id]?.armorSlot) {
    return { kind: 'applied', slot: 'none' };
  }

  const occupiedByOther = Object.entries(inventoryItems).some(
    ([itemId, itemState]) => itemId !== id && itemState.armorSlot === slotKind
  );
  if (occupiedByOther) {
    return {
      kind: 'blocked',
      message:
        slotKind === 'shield'
          ? 'Desequipe o escudo atual antes de equipar este.'
          : 'Desequipe a armadura atual antes de equipar esta.',
    };
  }

  if (slotKind === 'shield' && isHandOccupied(inventoryItems, 'off', id)) {
    const offHandWeapon = Object.entries(inventoryItems).find(
      ([itemId, itemState]) => itemId !== id && itemState.weaponSlot === 'off'
    );
    const mainHandFree = !isHandOccupied(inventoryItems, 'main', id);

    if (offHandWeapon && mainHandFree) {
      return { kind: 'applied', slot: slotKind, autoShiftOffHandWeaponId: offHandWeapon[0] };
    }
    return { kind: 'blocked', message: 'Sua mão secundária precisa estar livre para equipar um escudo.' };
  }

  return { kind: 'applied', slot: slotKind };
}
