import { getAbilityModifier } from './ability-modifier';

export interface EquippedArmorItem {
  name: string;
  bonus: number;
  weightClass?: 'light' | 'medium' | 'heavy';
  strengthRequirement?: number;
}

// Barbarian's/Monk's "Unarmored Defense" and Draconic Bloodline sorcerers'
// "Draconic Resilience" all replace the normal 10-base AC formula with
// their own while unarmored, but differ in the details (10 vs 13 base,
// an extra ability modifier or not, shield allowed or not) - a single
// structured rule instead of three one-off boolean params, so
// getArmorClassBreakdown stays agnostic of which class/subclass it is.
export interface UnarmoredDefenseRule {
  label: string;
  baseAC: number;
  secondaryAbilityScore?: string;
  requiresNoShield: boolean;
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
export function getArmorClassBreakdown(
  dexScore: string,
  equippedArmor: EquippedArmorItem[],
  fightingStyle: string | null = null,
  unarmoredDefense?: UnarmoredDefenseRule
): ArmorClassBreakdown {
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

  const items = equippedArmor.map((item) => ({ name: item.name, bonus: item.bonus }));

  // Fighting Style's "Defense" option: +1 AC while wearing any armor.
  const fightingStyleDefenseBonus = fightingStyle === 'Defense' && bodyArmor ? 1 : 0;
  if (fightingStyleDefenseBonus > 0) {
    items.push({ name: 'Estilo de Luta: Defesa', bonus: fightingStyleDefenseBonus });
  }

  // Unarmored Defense / Draconic Resilience: only active with no body
  // armor, and (Monk only) no shield either.
  const shieldBlocksRule = unarmoredDefense?.requiresNoShield && equippedArmor.length > 0;
  const unarmoredDefenseActive = unarmoredDefense != null && !bodyArmor && !shieldBlocksRule;
  const secondaryMod =
    unarmoredDefenseActive && unarmoredDefense.secondaryAbilityScore
      ? (getAbilityModifier(unarmoredDefense.secondaryAbilityScore) ?? 0)
      : 0;
  const unarmoredDefenseBonus = unarmoredDefenseActive ? unarmoredDefense.baseAC - base + secondaryMod : 0;
  if (unarmoredDefenseActive) {
    items.push({ name: unarmoredDefense.label, bonus: unarmoredDefenseBonus });
  }

  return {
    base,
    dexModifier,
    effectiveDexModifier,
    dexCapNote,
    items,
    total: base + effectiveDexModifier + itemsBonus + fightingStyleDefenseBonus + unarmoredDefenseBonus,
  };
}
