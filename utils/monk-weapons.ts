// PHB "Martial Arts" (Monk, 1st level): shortswords and any simple melee
// weapon lacking the two-handed or heavy property count as "monk weapons",
// letting the monk use DEX instead of STR for their attack/damage rolls.
// `englishName` is the raw base_items name (not the translated display
// name) so the "Shortsword" special case stays stable across translation
// edits - see WeaponItemDetail.englishName.
export function isMonkWeapon(item: {
  englishName: string;
  weaponCategory?: 'simple' | 'martial';
  isRanged: boolean;
  propertyCodes: string[];
}): boolean {
  if (item.isRanged || item.propertyCodes.includes('H') || item.propertyCodes.includes('2H')) return false;
  return item.weaponCategory === 'simple' || item.englishName === 'Shortsword';
}
