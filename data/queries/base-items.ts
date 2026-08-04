import type { SQLiteDatabase } from 'expo-sqlite';

import { ARMOR_TYPE_LABELS, WEAPON_CATEGORY_LABELS, WEAPON_PROPERTY_LABELS } from '@/constants/item-codes';
import { ITEM_WEIGHT_KG_OVERRIDES } from '@/constants/item-weight-overrides';
import { parseJson } from '../rows';
import { getTranslations, localizedName, type TranslationDict } from './localize';

// 'general' has no live query behind it yet - the `items` table (potions,
// torches, rope, clothing, etc.) isn't translated in the bundled db yet (see
// docs/data-schema.md). It stays in the category union just so the
// Inventory screen can keep rendering an (empty) "Itens em Geral" section
// instead of dropping it.
export type CuratedItemCategory = 'weapon' | 'armor' | 'consumable' | 'general';

export interface CuratedBaseItem {
  id: number;
  category: CuratedItemCategory;
  name: string;
  properties?: string;
  weight: string;
  damageDice?: string;
  armorClassBonus?: string;
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

function categorize(type: string | null): CuratedItemCategory {
  if (type === 'R' || type === 'M') return 'weapon';
  if (type === 'MA' || type === 'HA' || type === 'LA' || type === 'S') return 'armor';
  return 'consumable';
}

// lb -> kg, formatted with a pt-BR comma decimal. Falls back to a plain
// conversion only when there's no verified book weight in
// ITEM_WEIGHT_KG_OVERRIDES - Devir's official PHB rounds to cleaner metric
// figures rather than converting precisely, so the override always wins for
// items we've checked against the printed book.
function formatWeightKg(name: string, weightLb: number | null): string {
  const override = ITEM_WEIGHT_KG_OVERRIDES[name];
  if (override) return override;

  if (weightLb == null) return '0';
  const kg = weightLb * 0.4536;
  let rounded = Math.round(kg * 10) / 10;
  if (rounded === 0 && kg > 0) rounded = Math.round(kg * 100) / 100;
  return String(rounded).replace('.', ',');
}

// ft -> meters, matching the printed PHB's conversion (5 ft = 1,5 m, i.e. a
// flat 0,3 factor - verified against several ranged weapons' "distância x/y"
// entries in translations/pt-BR/_raw-extracts/PHB.txt). `range` is a
// "normal/long" string like "80/320".
function convertRangeToMeters(range: string): string {
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
  if (propCodes.includes('A')) parts.push(details.range ? `Munição (${convertRangeToMeters(details.range)})` : 'Munição');

  for (const code of propCodes) {
    if (code === '2H' || code === 'A') continue;
    parts.push(WEAPON_PROPERTY_LABELS[code] ?? code);
  }

  if (row.type === 'R') parts.push('À Distância');

  return parts.join(', ');
}

function mapCuratedRow(row: BaseItemRow, translations: TranslationDict): CuratedBaseItem {
  const category = categorize(row.type);
  const name = localizedName(row.id, row.name, translations);

  if (category === 'weapon') {
    return {
      id: row.id,
      category,
      name,
      properties: buildWeaponProperties(row),
      weight: formatWeightKg(row.name, row.weight_lb),
      damageDice: formatDamageDice(row.damage),
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
    };
  }

  return {
    id: row.id,
    category,
    name,
    properties: 'Munição',
    weight: formatWeightKg(row.name, row.weight_lb),
    defaultQuantity: '20',
  };
}

// Curated inventory for the app's level-2 Evocation Wizard demo character:
// the base_items (weapons/armor/ammo) that already have a pt-BR translation
// in the bundled db. General adventuring gear (potions, torches, rope,
// clothing, etc.) lives in the untranslated `items` table, so it's left out
// entirely rather than shown in English.
const CURATED_ITEM_NAMES = ['Light Crossbow', 'Shortsword', 'Breastplate', 'Shield', 'Crossbow Bolt'];

export async function getCuratedInventoryBaseItems(db: SQLiteDatabase): Promise<CuratedBaseItem[]> {
  const placeholders = CURATED_ITEM_NAMES.map(() => '?').join(', ');
  // Sequential, not Promise.all: overlapping queries on the same
  // SQLiteDatabase connection can crash on native (see data/queries/spells.ts).
  const rows = await db.getAllAsync<BaseItemRow>(
    `SELECT id, name, type, weight_lb, damage, properties, details
       FROM base_items
       WHERE source = 'PHB' AND name IN (${placeholders})`,
    ...CURATED_ITEM_NAMES
  );
  const translations = await getTranslations(db, 'base_item');
  return rows.map((row) => mapCuratedRow(row, translations));
}
