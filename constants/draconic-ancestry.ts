// PHB p.34 "Draconic Ancestry" table - not modeled as a subrace (5etools
// generates these 10 via an unexpanded `_versions`/`_implementations`
// template, see scripts/import-5e-data.mjs's races section), so it's a
// plain constant, picked in a dedicated wizard step instead. Distance
// conversion (ft -> m) follows the same flat 0,3 factor already used
// elsewhere for printed pt-BR conversions (see data/queries/base-items.ts's
// convertRangeToMeters).
export interface DraconicAncestryOption {
  key: string;
  labelPt: string;
  damageTypePt: string;
  // shape/saveAbility verified against the PHB's own Draconic Ancestry table
  // (5e-2014-data/races.json) - drive both the racial trait text
  // (getDraconicAncestryDetailEntries) and the Breath Weapon inventory
  // item's computed stats (getBreathWeaponStats).
  shape: 'cone' | 'line';
  saveAbility: 'dex' | 'con';
}

export const DRACONIC_ANCESTRIES: DraconicAncestryOption[] = [
  { key: 'black', labelPt: 'Preto', damageTypePt: 'Ácido', shape: 'line', saveAbility: 'dex' },
  { key: 'blue', labelPt: 'Azul', damageTypePt: 'Elétrico', shape: 'line', saveAbility: 'dex' },
  { key: 'brass', labelPt: 'Latão', damageTypePt: 'Fogo', shape: 'line', saveAbility: 'dex' },
  { key: 'bronze', labelPt: 'Bronze', damageTypePt: 'Elétrico', shape: 'line', saveAbility: 'dex' },
  { key: 'copper', labelPt: 'Cobre', damageTypePt: 'Ácido', shape: 'line', saveAbility: 'dex' },
  { key: 'gold', labelPt: 'Dourado', damageTypePt: 'Fogo', shape: 'cone', saveAbility: 'dex' },
  { key: 'green', labelPt: 'Verde', damageTypePt: 'Veneno', shape: 'cone', saveAbility: 'con' },
  { key: 'red', labelPt: 'Vermelho', damageTypePt: 'Fogo', shape: 'cone', saveAbility: 'dex' },
  // PHB (5e-2014-data/races.json): Silver's breath weapon is a Constitution
  // save, not Dexterity - it was previously miscoded here to match every
  // other cone-shaped breath weapon, but Green/Silver/White are the three
  // Constitution-save exceptions.
  { key: 'silver', labelPt: 'Prateado', damageTypePt: 'Frio', shape: 'cone', saveAbility: 'con' },
  { key: 'white', labelPt: 'Branco', damageTypePt: 'Frio', shape: 'cone', saveAbility: 'con' },
];

const SAVE_ABILITY_LABELS_PT: Record<'dex' | 'con', string> = { dex: 'Destreza', con: 'Constituição' };

// 15 ft. cone / 5x30 ft. line (PHB), converted with the app's flat 0,3 ft->m
// factor (see data/queries/base-items.ts's convertRangeToMeters).
function getBreathWeaponAreaLabel(shape: 'cone' | 'line'): string {
  return shape === 'cone' ? 'Cone de 4,5 m' : 'Linha de 1,5 x 9 m';
}

// The book's own trait text for these three racial_traits rows never names
// the player's actual pick (same reasoning as Favored Enemy/Natural Explorer
// in constants/favored-enemy.ts) - appended to the static translated entries
// in data/queries/feature-detail.ts's getRacialTrait. The save DC/roll math
// itself isn't repeated here - it's on the Breath Weapon inventory item
// (see getBreathWeaponStats), so this only needs area + damage type.
export function getDraconicAncestryDetailEntries(
  ancestryKey: string | null | undefined,
  traitName: 'Draconic Ancestry' | 'Breath Weapon' | 'Damage Resistance'
): string[] {
  if (!ancestryKey) return [];
  const ancestry = DRACONIC_ANCESTRIES.find((a) => a.key === ancestryKey);
  if (!ancestry) return [];

  if (traitName === 'Draconic Ancestry') {
    return [`Seu ancestral dracônico é do tipo ${ancestry.labelPt}, associado a dano de ${ancestry.damageTypePt}.`];
  }
  if (traitName === 'Breath Weapon') {
    return [`Alcance: ${getBreathWeaponAreaLabel(ancestry.shape)}. Tipo de dano: ${ancestry.damageTypePt}.`];
  }
  return [`Você possui resistência a dano de ${ancestry.damageTypePt}.`];
}

// Level-1 max HP-style flat table (PHB p.34): the breath weapon's damage
// dice pool grows with character level, independent of dragon ancestry.
export function getBreathWeaponDamageDice(level: number): string {
  if (level >= 16) return '5d6';
  if (level >= 11) return '4d6';
  if (level >= 6) return '3d6';
  return '2d6';
}

export interface BreathWeaponStats {
  name: string;
  damageDice: string;
  damageTypeLabel: string;
  shape: 'cone' | 'line';
  areaLabel: string;
  saveAbilityLabel: string;
  saveDC: number;
}

// Centralizes the Breath Weapon's computed stats (constants/draconic-
// ancestry.ts's own data + the character's level/CON/proficiency) - used by
// both the inventory list (character-inventory.tsx) and the item detail
// screen (item/[id].tsx) so the math only lives in one place.
export function getBreathWeaponStats(
  ancestryKey: string,
  level: number,
  conModifier: number,
  proficiencyBonus: number
): BreathWeaponStats | null {
  const ancestry = DRACONIC_ANCESTRIES.find((a) => a.key === ancestryKey);
  if (!ancestry) return null;

  return {
    name: `Arma de Sopro (${ancestry.labelPt})`,
    damageDice: getBreathWeaponDamageDice(level),
    damageTypeLabel: ancestry.damageTypePt,
    shape: ancestry.shape,
    areaLabel: getBreathWeaponAreaLabel(ancestry.shape),
    saveAbilityLabel: SAVE_ABILITY_LABELS_PT[ancestry.saveAbility],
    saveDC: 8 + proficiencyBonus + conModifier,
  };
}

// Synthetic itemId (see data/queries/equipment-lookup.ts's itemKey - this
// deliberately doesn't use that convention, since it never resolves through
// parseItemKey/base_items/items at all) marking a character's granted Breath
// Weapon inventory row - see data/wizard/assemble-character.ts (grant) and
// components/character/character-inventory.tsx + app/sheet/[characterId]/
// item/[id].tsx (rendering, both special-case this id before any DB lookup).
export const BREATH_WEAPON_ITEM_ID = 'natural:breath-weapon';
