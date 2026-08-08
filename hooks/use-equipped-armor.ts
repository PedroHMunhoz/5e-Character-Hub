import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { getCuratedInventoryBaseItems } from '@/data/queries/base-items';
import type { EquippedArmorItem } from '@/utils/armor-class';
import { useCharacter } from './use-character';

export function useEquippedArmor(): EquippedArmorItem[] {
  const db = useSQLiteContext();
  const { character } = useCharacter();
  const [equippedArmor, setEquippedArmor] = useState<EquippedArmorItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    getCuratedInventoryBaseItems(db).then((items) => {
      if (cancelled) return;
      const equipped = items
        .filter((item) => item.category === 'armor' && character.inventoryItems[String(item.id)]?.armorSlot != null)
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
