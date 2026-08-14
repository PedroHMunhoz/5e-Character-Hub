import type { SQLiteDatabase } from 'expo-sqlite';

import {
  ARMOR_TYPE_LABELS,
  getArmorSlotKind,
  getWeaponHandedness,
  WEAPON_CATEGORY_LABELS,
  WEAPON_PROPERTY_LABELS,
  type WeaponHandedness,
} from '@/constants/item-codes';
import { ITEM_WEIGHT_KG_OVERRIDES } from '@/constants/item-weight-overrides';
import { parseJson } from '../rows';
import { getTranslations, localizedName, type TranslationDict } from './localize';

// 'general' has no live query behind it yet - the `items` table (potions,
// torches, rope, clothing, etc.) IS translated in the bundled db now
// (translations/pt-BR/PHB/items.json), but nothing queries it yet: no
// getTranslations('item') call, no categorize()-equivalent split, no UI
// wiring. It stays in the category union just so the Inventory screen can
// keep rendering an (empty) "Itens em Geral" section instead of dropping it.
export type CuratedItemCategory = 'weapon' | 'armor' | 'consumable' | 'general';

export interface CuratedBaseItem {
  id: number;
  category: CuratedItemCategory;
  name: string;
  properties?: string;
  weight: string;
  damageDice?: string;
  handedness?: WeaponHandedness;
  armorClassBonus?: string;
  armorSlotKind?: 'body' | 'shield';
  armorWeightClass?: 'light' | 'medium' | 'heavy';
  defaultQuantity?: string;
}

interface BaseItemRow {
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
}

interface WeaponDetails {
  weaponCategory?: string;
  range?: string;
}

interface ArmorDetails {
  ac?: number;
}

interface PackContentsEntry {
  item?: string;
  quantity?: number;
}

interface PackDetails {
  packContents?: (string | PackContentsEntry)[];
}

// `details.packContents` covers two unrelated shapes from the raw 5etools
// data: a "pack" of N units of one underlying item (ammo like "Crossbow
// Bolts (20)", or Ball Bearings/Caltrops/Iron Spikes - a single object
// entry with a `quantity`), and a bundle of different items (Explorer's
// Pack, Deck of Many Things - multiple entries, some bare strings). Only
// the former should be exploded into that many units of the component item
// when granted to a character; verified this length===1-with-quantity rule
// against every packContents entry in the bundled PHB dataset (base_items
// and items tables).
export function getSingleItemPackContents(detailsJson: string | null): { itemRef: string; quantity: number } | undefined {
  const packContents = parseJson<PackDetails>(detailsJson)?.packContents;
  if (!Array.isArray(packContents) || packContents.length !== 1) return undefined;
  const entry = packContents[0];
  if (typeof entry !== 'object' || !entry.item || !entry.quantity) return undefined;
  return { itemRef: entry.item, quantity: entry.quantity };
}

// Armor weight class drives how much of the DEX modifier applies to AC (see
// utils/armor-class.ts) - shield ('S') isn't a body-armor weight class, so
// it's intentionally absent here.
const ARMOR_WEIGHT_CLASSES: Record<string, 'light' | 'medium' | 'heavy'> = {
  LA: 'light',
  MA: 'medium',
  HA: 'heavy',
};

export function categorize(type: string | null): CuratedItemCategory {
  if (type === 'R' || type === 'M') return 'weapon';
  if (type === 'MA' || type === 'HA' || type === 'LA' || type === 'S') return 'armor';
  if (type === 'AT' || type === 'INS' || type === 'SCF') return 'general';
  return 'consumable';
}

// Short display label for 'general' items (tools, instruments, spellcasting
// foci) - these aren't stackable consumables, so they don't get a
// "Munição"-style properties tag. Classification verified against
// translations/pt-BR/CLASSIFICACAO-ITENS-GERAIS.md (PHB p.152 equipment table).
export const GENERAL_ITEM_TYPE_LABELS: Record<string, string> = {
  AT: 'Ferramenta',
  INS: 'Instrumento Musical',
  SCF: 'Foco de Conjuração',
};

// lb -> kg, formatted with a pt-BR comma decimal. Galápagos's official PHB
// doesn't convert precisely - the whole equipment table (weapons, armor,
// tools, instruments, foci) rounds to a flat "1 kg ≈ 2 lb" rule instead,
// verified against ~90 base_items in translations/pt-BR/_raw-extracts/PHB.txt.
// ITEM_WEIGHT_KG_OVERRIDES only holds the handful of items that print a
// different value than that rule (either extra decimal precision, like the
// 20-packs of ammo, or a genuinely divergent book value - see DUVIDAS.md).
//
// `quantity` (default 1) scales the raw per-unit weight *before* rounding -
// needed for stackable items (ammo) where the catalog row is a single unit
// (e.g. "Arrow", weight_lb 0.05) but the character owns a stack of them.
// Rounding per-unit first and multiplying the rounded string afterwards
// compounds rounding error (0,03kg × 20 = 0,6kg); multiplying the raw
// weight_lb first reconstructs the printed pack weight exactly (0,05lb ×
// 0,5 × 20 = 0,5kg) since every ammo type's singular weight_lb is exactly
// its pack's weight_lb / pack size (verified against the bundled db).
export function formatWeightKg(name: string, weightLb: number | null, quantity = 1): string {
  const override = ITEM_WEIGHT_KG_OVERRIDES[name];
  const kgPerUnit = override ? Number(override.replace(',', '.')) : weightLb == null ? 0 : weightLb * 0.5;
  const kg = kgPerUnit * quantity;

  if (quantity !== 1) {
    // A stack's total can land exactly on a value the 1-decimal-primary
    // rule below can't represent without rounding away from the printed
    // total (e.g. 20 crossbow bolts = 0,75kg, ambiguous between 0,7/0,8 at
    // 1 decimal) - round straight to 2 decimals instead. JS's number-to-
    // string conversion already drops the trailing zero for values that
    // land on a clean 1-decimal number (0.50 -> "0.5"), so this doesn't add
    // spurious precision for the common case (e.g. 20 arrows = 0,5kg).
    return String(Math.round(kg * 100) / 100).replace('.', ',');
  }

  let rounded = Math.round(kg * 10) / 10;
  if (rounded === 0 && kg > 0) rounded = Math.round(kg * 100) / 100;
  return String(rounded).replace('.', ',');
}

// ft -> meters, matching the printed PHB's conversion (5 ft = 1,5 m, i.e. a
// flat 0,3 factor - verified against several ranged weapons' "distância x/y"
// entries in translations/pt-BR/_raw-extracts/PHB.txt). `range` is a
// "normal/long" string like "80/320".
export function convertRangeToMeters(range: string): string {
  return range
    .split('/')
    .map((part) => {
      const feet = Number(part);
      if (Number.isNaN(feet)) return part;
      const meters = Math.round(feet * 0.3 * 100) / 100;
      return String(meters).replace('.', ',');
    })
    .join('/');
}

// Detalhe de alcance mostrado no modal da propriedade Munição/Arremesso -
// além do alcance normal e até o alcance longo, o ataque sofre desvantagem
// (regra de "Alcance de Ataque à Distância", PHB). `rangeMeters` já está no
// formato produzido por convertRangeToMeters, ex. "24/96".
export function formatRangeDetail(rangeMeters: string): string {
  const toSquares = (meters: string) => Math.floor(Number(meters.replace(',', '.')) / 1.5);
  const [normal, long] = rangeMeters.split('/');
  const normalText = `${normal}m/${toSquares(normal)}q (Normal)`;
  if (!long) return normalText;
  return `${normalText} OU ${long}m/${toSquares(long)}q (Desvantagem)`;
}

function formatDamageDice(damageJson: string | null): string | undefined {
  const damage = parseJson<DamageInfo>(damageJson);
  const dmg1 = damage?.dmg1;
  if (!dmg1) return undefined;
  return dmg1.replace(/^1d/, 'd');
}

function buildWeaponProperties(row: BaseItemRow): string {
  const details = parseJson<WeaponDetails>(row.details) ?? {};
  const propCodes = parseJson<string[]>(row.properties) ?? [];
  const parts: string[] = [];

  if (propCodes.includes('2H')) parts.push('Duas Mãos');
  if (details.weaponCategory) parts.push(WEAPON_CATEGORY_LABELS[details.weaponCategory] ?? details.weaponCategory);
  if (propCodes.includes('A'))
    parts.push(details.range ? `Munição (${convertRangeToMeters(details.range)})` : 'Munição');
  if (propCodes.includes('T'))
    parts.push(details.range ? `Arremesso (${convertRangeToMeters(details.range)})` : 'Arremesso');

  for (const code of propCodes) {
    if (code === '2H' || code === 'A' || code === 'T') continue;
    parts.push(WEAPON_PROPERTY_LABELS[code] ?? code);
  }

  if (row.type === 'R') parts.push('À Distância');

  return parts.join(', ');
}

function mapCuratedRow(row: BaseItemRow, translations: TranslationDict, quantity = 1): CuratedBaseItem {
  const category = categorize(row.type);
  const name = localizedName(row.id, row.name, translations);

  if (category === 'weapon') {
    const propCodes = parseJson<string[]>(row.properties) ?? [];
    return {
      id: row.id,
      category,
      name,
      properties: buildWeaponProperties(row),
      weight: formatWeightKg(row.name, row.weight_lb),
      damageDice: formatDamageDice(row.damage),
      handedness: getWeaponHandedness(propCodes),
    };
  }

  if (category === 'armor') {
    const details = parseJson<ArmorDetails>(row.details) ?? {};
    const ac = details.ac ?? 0;
    const armorClassBonus = row.type === 'S' ? ac : ac - 10;
    return {
      id: row.id,
      category,
      name,
      properties: ARMOR_TYPE_LABELS[row.type ?? ''] ?? row.type ?? undefined,
      weight: formatWeightKg(row.name, row.weight_lb),
      armorClassBonus: String(armorClassBonus),
      armorSlotKind: getArmorSlotKind(row.type),
      armorWeightClass: ARMOR_WEIGHT_CLASSES[row.type ?? ''],
    };
  }

  if (category === 'general') {
    return {
      id: row.id,
      category,
      name,
      properties: GENERAL_ITEM_TYPE_LABELS[row.type ?? ''] ?? row.type ?? undefined,
      weight: formatWeightKg(row.name, row.weight_lb),
    };
  }

  return {
    id: row.id,
    category,
    name,
    properties: 'Munição',
    // Consumables are the only stackable category with a quantity indicator
    // in the UI today (the StackableItemCard badge) - weight here reflects
    // the full owned stack. Weapon/armor/general above intentionally keep
    // showing a single unit's weight - see docs/TODO.md for the
    // deferred "weapon quantity isn't shown anywhere" gap.
    weight: formatWeightKg(row.name, row.weight_lb, quantity),
    defaultQuantity: String(getSingleItemPackContents(row.details)?.quantity ?? 1),
  };
}

// A real character's base_items-sourced inventory rows (weapons/armor/ammo)
// by id, reusing the exact same categorization/mapping as the curated demo
// list above - the wizard's starting-equipment resolver grants these by id,
// not by a fixed name list. `quantityById` (row id -> owned quantity) scales
// the displayed weight for stackable (consumable) rows - see mapCuratedRow.
export async function getBaseItemsByIds(
  db: SQLiteDatabase,
  ids: number[],
  quantityById?: Map<number, number>
): Promise<CuratedBaseItem[]> {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await db.getAllAsync<BaseItemRow>(
    `SELECT id, name, type, weight_lb, damage, properties, details FROM base_items WHERE id IN (${placeholders})`,
    ...ids
  );
  const translations = await getTranslations(db, 'base_item');
  return rows.map((row) => mapCuratedRow(row, translations, quantityById?.get(row.id) ?? 1));
}
