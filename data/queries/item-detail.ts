import type { SQLiteDatabase } from 'expo-sqlite';

import {
  ARMOR_TYPE_LABELS,
  DAMAGE_TYPE_LABELS,
  getArmorSlotKind,
  getWeaponHandedness,
  WEAPON_CATEGORY_LABELS,
  type WeaponHandedness,
} from '@/constants/item-codes';
import { parseJson } from '../rows';
import {
  categorize,
  convertRangeToMeters,
  formatRangeDetail,
  formatWeightKg,
  GENERAL_ITEM_TYPE_LABELS,
  getSingleItemPackContents,
} from './base-items';
import { getTranslations, localizedName } from './localize';

interface BaseItemDetailRow {
  id: number;
  name: string;
  type: string | null;
  weight_lb: number | null;
  damage: string | null;
  properties: string | null;
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
}

export interface ConsumableItemDetail {
  category: 'consumable';
  id: number;
  name: string;
  weight: string;
  categoryLabel: string;
  defaultQuantity: string;
}

export interface GeneralItemDetail {
  category: 'general';
  id: number;
  name: string;
  weight: string;
  categoryLabel: string;
}

export type ItemDetail = WeaponItemDetail | ArmorItemDetail | ConsumableItemDetail | GeneralItemDetail;

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

function mapArmorDetail(row: BaseItemDetailRow, name: string): ArmorItemDetail {
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
  };
}

function mapConsumableDetail(row: BaseItemDetailRow, name: string, quantity = 1): ConsumableItemDetail {
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
  };
}

function mapGeneralDetail(row: BaseItemDetailRow, name: string): GeneralItemDetail {
  return {
    category: 'general',
    id: row.id,
    name,
    weight: formatWeightKg(row.name, row.weight_lb),
    categoryLabel: GENERAL_ITEM_TYPE_LABELS[row.type ?? ''] ?? row.type ?? '',
  };
}

export async function getBaseItemDetailById(db: SQLiteDatabase, id: number, quantity = 1): Promise<ItemDetail | null> {
  const row = await db.getFirstAsync<BaseItemDetailRow>(
    'SELECT id, name, type, weight_lb, damage, properties, details FROM base_items WHERE id = ?',
    id
  );
  if (!row) return null;

  const translations = await getTranslations(db, 'base_item');
  const name = localizedName(row.id, row.name, translations);
  const category = categorize(row.type);

  if (category === 'weapon') return mapWeaponDetail(row, name);
  if (category === 'armor') return mapArmorDetail(row, name);
  if (category === 'general') return mapGeneralDetail(row, name);
  return mapConsumableDetail(row, name, quantity);
}
