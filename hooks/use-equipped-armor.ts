import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { getBaseItemsByIds } from '@/data/queries/base-items';
import { parseItemKey } from '@/data/queries/equipment-lookup';
import type { EquippedArmorItem } from '@/utils/armor-class';
import { useCharacter } from './use-character';

export function useEquippedArmor(): EquippedArmorItem[] {
  const db = useSQLiteContext();
  const { character } = useCharacter();
  const [equippedArmor, setEquippedArmor] = useState<EquippedArmorItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    // Armor only ever comes from base_items in this app's model (armor/
    // shield rows all live there, never in `items`), so equipped-armor keys
    // are always the bare, unprefixed form - see data/queries/equipment-
    // lookup.ts's itemKey.
    const equippedBaseItemIds = Object.entries(character.inventoryItems)
      .filter(([, state]) => state.armorSlot != null)
      .map(([key]) => parseItemKey(key))
      .filter((parsed) => parsed.source === 'base_items')
      .map((parsed) => parsed.id);

    getBaseItemsByIds(db, equippedBaseItemIds).then((items) => {
      if (cancelled) return;
      const equipped = items
        .filter((item) => item.category === 'armor')
        .map((item) => ({
          name: item.name,
          bonus: Number(item.armorClassBonus ?? '0'),
          weightClass: item.armorWeightClass,
        }));
      setEquippedArmor(equipped);
    });
    return () => {
      cancelled = true;
    };
  }, [db, character.inventoryItems]);

  return equippedArmor;
}
