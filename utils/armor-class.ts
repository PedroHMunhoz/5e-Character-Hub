import { getAbilityModifier } from './ability-modifier';

export interface EquippedArmorItem {
  name: string;
  bonus: number;
  weightClass?: 'light' | 'medium' | 'heavy';
}

export interface ArmorClassBreakdown {
  base: number;
  dexModifier: number;
  effectiveDexModifier: number;
  dexCapNote?: string;
  items: { name: string; bonus: number }[];
  total: number;
}

const MEDIUM_ARMOR_DEX_CAP = 2;

// 5e AC rule: light armor applies the full DEX modifier, medium armor caps
// it at +2, heavy armor ignores it entirely. Shields (weightClass
// undefined) never affect the cap, they just add their flat bonus.
export function getArmorClassBreakdown(dexScore: string, equippedArmor: EquippedArmorItem[]): ArmorClassBreakdown {
  const dexModifier = getAbilityModifier(dexScore) ?? 0;
  const bodyArmor = equippedArmor.find((item) => item.weightClass != null);

  let effectiveDexModifier = dexModifier;
  let dexCapNote: string | undefined;
  if (bodyArmor?.weightClass === 'medium' && dexModifier > MEDIUM_ARMOR_DEX_CAP) {
    effectiveDexModifier = MEDIUM_ARMOR_DEX_CAP;
    dexCapNote = 'Limitado a +2 (armadura média)';
  } else if (bodyArmor?.weightClass === 'heavy') {
    effectiveDexModifier = 0;
    dexCapNote = 'Não se aplica (armadura pesada)';
  }

  const base = 10;
  const itemsBonus = equippedArmor.reduce((sum, item) => sum + item.bonus, 0);

  return {
    base,
    dexModifier,
    effectiveDexModifier,
    dexCapNote,
    items: equippedArmor.map((item) => ({ name: item.name, bonus: item.bonus })),
    total: base + effectiveDexModifier + itemsBonus,
  };
}
