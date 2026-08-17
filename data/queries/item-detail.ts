import type { SQLiteDatabase } from 'expo-sqlite';

import {
  ARMOR_TYPE_LABELS,
  ARMOR_TYPE_TO_CATEGORY,
  DAMAGE_TYPE_LABELS,
  getArmorSlotKind,
  getWeaponHandedness,
  WEAPON_CATEGORY_LABELS,
  type WeaponHandedness,
} from '@/constants/item-codes';
import type { ArmorCategory } from '@/types/character';
import { parseJson, toEntries } from '../rows';
import {
  categorize,
  convertRangeToMeters,
  formatRangeDetail,
  formatWeightKg,
  GENERAL_ITEM_TYPE_LABELS,
  getSingleItemPackContents,
} from './base-items';
import { categorizeItem } from './items';
import { getTranslations, localizedEntries, localizedName } from './localize';

interface BaseItemDetailRow {
  id: number;
  name: string;
  type: string | null;
  weight_lb: number | null;
  damage: string | null;
  properties: string | null;
  details: string | null;
  entries: string | null;
}

interface GeneralItemDetailRow {
  id: number;
  name: string;
  weight_lb: number | null;
  entries: string | null;
  details: string | null;
}

interface DamageInfo {
  dmg1?: string;
  dmg2?: string;
  dmgType?: string;
}

interface WeaponDetails {
  weaponCategory?: string;
  range?: string;
}

interface ArmorDetails {
  ac?: number;
  strength?: number;
  stealth?: boolean;
}

export interface WeaponItemDetail {
  category: 'weapon';
  id: number;
  name: string;
  // Raw (untranslated) base_items name - stable across translation edits,
  // needed by utils/monk-weapons.ts's "Shortsword" special case.
  englishName: string;
  weight: string;
  categoryLabel: string;
  attackAbility: 'str' | 'dex' | 'finesse';
  handedness: WeaponHandedness;
  damageDice: string;
  damageDiceVersatile?: string;
  damageTypeLabel?: string;
  propertyCodes: string[];
  isRanged: boolean;
  range?: string;
  rangeDetail?: string;
  weaponCategory?: 'simple' | 'martial';
}

export interface ArmorItemDetail {
  category: 'armor';
  id: number;
  name: string;
  weight: string;
  categoryLabel: string;
  armorClassBonus: number;
  strengthRequirement?: number;
  stealthDisadvantage: boolean;
  armorSlotKind: 'body' | 'shield';
  // Proficiency category this armor/shield requires - undefined for the rare
  // row with an unrecognized `type` code. See constants/item-codes.ts's
  // ARMOR_TYPE_TO_CATEGORY.
  armorCategory?: ArmorCategory;
  entries: string[];
}

export interface ConsumableItemDetail {
  category: 'consumable';
  id: number;
  name: string;
  weight: string;
  categoryLabel: string;
  defaultQuantity: string;
  entries: string[];
}

export interface GeneralItemDetail {
  category: 'general';
  id: number;
  name: string;
  weight: string;
  categoryLabel: string;
  entries: string[];
}

// Dragonborn's Breath Weapon (see constants/draconic-ancestry.ts's
// getBreathWeaponStats) - never resolved from base_items/items (it isn't
// catalog gear), so this variant is built entirely client-side by
// app/sheet/[characterId]/item/[id].tsx instead of by a getXDetailById query
// here. No attackAbility/handedness/propertyCodes like WeaponItemDetail: it
// isn't wielded (no equip slot) and doesn't use an attack roll (target saves
// instead), so it needs its own render branch (NaturalWeaponSection).
export interface NaturalWeaponItemDetail {
  category: 'naturalWeapon';
  name: string;
  weight: string;
  categoryLabel: string;
  damageDice: string;
  damageTypeLabel: string;
  areaLabel: string;
  saveAbilityLabel: string;
  saveDC: number;
}

export type ItemDetail =
  | WeaponItemDetail
  | ArmorItemDetail
  | ConsumableItemDetail
  | GeneralItemDetail
  | NaturalWeaponItemDetail;

function mapWeaponDetail(row: BaseItemDetailRow, name: string): WeaponItemDetail {
  const damage = parseJson<DamageInfo>(row.damage) ?? {};
  const details = parseJson<WeaponDetails>(row.details) ?? {};
  const propertyCodes = parseJson<string[]>(row.properties) ?? [];
  const isRanged = row.type === 'R';

  const attackAbility: 'str' | 'dex' | 'finesse' = propertyCodes.includes('F') ? 'finesse' : isRanged ? 'dex' : 'str';

  const weaponCategoryLabel = details.weaponCategory
    ? (WEAPON_CATEGORY_LABELS[details.weaponCategory] ?? details.weaponCategory)
    : '';
  const rangeMeters = details.range ? convertRangeToMeters(details.range) : undefined;

  return {
    category: 'weapon',
    id: row.id,
    name,
    englishName: row.name,
    weight: formatWeightKg(row.name, row.weight_lb),
    categoryLabel: `Arma ${weaponCategoryLabel} ${isRanged ? 'À Distância' : 'Corpo a Corpo'}`
      .replace(/\s+/g, ' ')
      .trim(),
    attackAbility,
    handedness: getWeaponHandedness(propertyCodes),
    damageDice: damage.dmg1 ?? '',
    damageDiceVersatile: damage.dmg2,
    damageTypeLabel: damage.dmgType ? (DAMAGE_TYPE_LABELS[damage.dmgType] ?? damage.dmgType) : undefined,
    propertyCodes,
    isRanged,
    range: rangeMeters,
    rangeDetail: rangeMeters ? formatRangeDetail(rangeMeters) : undefined,
    weaponCategory: details.weaponCategory === 'simple' || details.weaponCategory === 'martial' ? details.weaponCategory : undefined,
  };
}

function mapArmorDetail(row: BaseItemDetailRow, name: string, entries: string[]): ArmorItemDetail {
  const details = parseJson<ArmorDetails>(row.details) ?? {};
  const ac = details.ac ?? 0;
  const armorClassBonus = row.type === 'S' ? ac : ac - 10;

  return {
    category: 'armor',
    id: row.id,
    name,
    weight: formatWeightKg(row.name, row.weight_lb),
    categoryLabel: row.type === 'S' ? 'Escudo' : `Armadura ${ARMOR_TYPE_LABELS[row.type ?? ''] ?? ''}`.trim(),
    armorClassBonus,
    strengthRequirement: details.strength,
    stealthDisadvantage: details.stealth ?? false,
    armorSlotKind: getArmorSlotKind(row.type),
    armorCategory: ARMOR_TYPE_TO_CATEGORY[row.type ?? ''],
    entries,
  };
}

function mapConsumableDetail(row: BaseItemDetailRow, name: string, entries: string[], quantity = 1): ConsumableItemDetail {
  return {
    category: 'consumable',
    id: row.id,
    name,
    // Reflects the full owned stack's weight - see formatWeightKg's doc
    // comment in data/queries/base-items.ts for why quantity is multiplied
    // before rounding, not after.
    weight: formatWeightKg(row.name, row.weight_lb, quantity),
    categoryLabel: 'Munição',
    defaultQuantity: String(getSingleItemPackContents(row.details)?.quantity ?? 1),
    entries,
  };
}

function mapGeneralDetail(row: BaseItemDetailRow, name: string, entries: string[]): GeneralItemDetail {
  return {
    category: 'general',
    id: row.id,
    name,
    weight: formatWeightKg(row.name, row.weight_lb),
    categoryLabel: GENERAL_ITEM_TYPE_LABELS[row.type ?? ''] ?? row.type ?? '',
    entries,
  };
}

export async function getBaseItemDetailById(db: SQLiteDatabase, id: number, quantity = 1): Promise<ItemDetail | null> {
  const row = await db.getFirstAsync<BaseItemDetailRow>(
    'SELECT id, name, type, weight_lb, damage, properties, details, entries FROM base_items WHERE id = ?',
    id
  );
  if (!row) return null;

  const translations = await getTranslations(db, 'base_item');
  const name = localizedName(row.id, row.name, translations);
  const entries = localizedEntries(row.id, toEntries(row.entries), translations);
  const category = categorize(row.type);

  if (category === 'weapon') return mapWeaponDetail(row, name);
  if (category === 'armor') return mapArmorDetail(row, name, entries);
  if (category === 'general') return mapGeneralDetail(row, name, entries);
  return mapConsumableDetail(row, name, entries, quantity);
}

// Detail for a character's items-table-sourced inventory rows (packs, kits,
// general adventuring gear) - mirrors getBaseItemDetailById's shape
// (ConsumableItemDetail/GeneralItemDetail) so app/sheet/[characterId]/
// item/[id].tsx can render either source with the same JSX, branching only
// on which query to call (see parseItemKey in equipment-lookup.ts). Weapons/
// armor never live in the `items` table (confirmed live against the bundled
// PHB dataset), so there's no weapon/armor case to cover here.
export async function getItemDetailById(db: SQLiteDatabase, id: number, quantity = 1): Promise<ConsumableItemDetail | GeneralItemDetail | null> {
  const row = await db.getFirstAsync<GeneralItemDetailRow>(
    'SELECT id, name, weight_lb, entries, details FROM items WHERE id = ?',
    id
  );
  if (!row) return null;

  const translations = await getTranslations(db, 'item');
  const name = localizedName(row.id, row.name, translations);
  const entries = localizedEntries(row.id, toEntries(row.entries), translations);
  const category = categorizeItem({ englishName: row.name, details: parseJson(row.details) });

  if (category === 'consumable') {
    return {
      category: 'consumable',
      id: row.id,
      name,
      weight: formatWeightKg(row.name, row.weight_lb, quantity),
      categoryLabel: 'Consumível',
      defaultQuantity: '1',
      entries,
    };
  }
  return {
    category: 'general',
    id: row.id,
    name,
    weight: formatWeightKg(row.name, row.weight_lb),
    categoryLabel: 'Item Geral',
    entries,
  };
}
