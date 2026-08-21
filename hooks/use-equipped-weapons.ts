import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { getWeaponPropertyCodesByIds } from '@/data/queries/base-items';
import { parseItemKey } from '@/data/queries/equipment-lookup';
import type { WeaponSlot } from '@/types/character';
import { useCharacter } from './use-character';

export interface EquippedWeaponProperties {
  slot: WeaponSlot;
  propertyCodes: string[];
}

// Weapons only ever come from base_items in this app's model (same
// assumption as hooks/use-equipped-armor.ts) - resolves the property codes
// of every currently-equipped weapon, keyed by which hand it's in, so rules
// that depend on BOTH equipped weapons (e.g. two-weapon fighting's Light
// requirement, PHB p.195) can be checked from either weapon's detail screen.
export function useEquippedWeapons(): EquippedWeaponProperties[] {
  const db = useSQLiteContext();
  const { character } = useCharacter();
  const [equippedWeapons, setEquippedWeapons] = useState<EquippedWeaponProperties[]>([]);

  useEffect(() => {
    let cancelled = false;

    const equippedEntries = Object.values(character.inventoryItems)
      .filter((state) => state.weaponSlot != null)
      .map((state) => ({ slot: state.weaponSlot as WeaponSlot, parsed: parseItemKey(state.itemId) }))
      .filter((entry) => entry.parsed.source === 'base_items');

    getWeaponPropertyCodesByIds(
      db,
      equippedEntries.map((entry) => entry.parsed.id)
    ).then((propertyCodesById) => {
      if (cancelled) return;
      setEquippedWeapons(
        equippedEntries.map((entry) => ({
          slot: entry.slot,
          propertyCodes: propertyCodesById.get(entry.parsed.id) ?? [],
        }))
      );
    });
    return () => {
      cancelled = true;
    };
  }, [db, character.inventoryItems]);

  return equippedWeapons;
}
