// Parses the raw 5etools starting-equipment DSL (classes.starting_equipment,
// backgrounds.starting_equipment) into a shape the wizard's equipment step
// can render without knowing the DSL. Pure data transformation - no
// SQLiteDatabase here; item-name resolution to a concrete DB id is a
// separate second pass (resolveEquipmentItemRefs), since it needs a
// database connection and the wizard batches all the name lookups from
// every group into a couple of sequential queries.
//
// Confirmed raw shapes (verified live against the bundled db - see
// docs/wizard-todo.md for known coverage gaps):
// - Class: `{ additionalFromBackground, default: string[], goldAlternative:
//   string, defaultData: RawGroup[] }` - `default` is prose, `defaultData`
//   is what this module actually parses. Confirmed `defaultData` DOES use
//   `_` fixed groups too (e.g. Wizard's spellbook, Cleric's shield+holy
//   symbol), not just `a`/`b`/`c` choice groups.
// - Background: bare `RawGroup[]`, no goldAlternative wrapper (backgrounds
//   have no RAW gold alternative).
// - RawGroup: either `{ _: RawEntry[] }` (always granted) or one or more of
//   `{ a: RawEntry[], b: RawEntry[], c?: RawEntry[], d?: RawEntry[] }`
//   (mutually exclusive options - the player picks exactly one key;
//   confirmed 3-way `a`/`b`/`c` groups exist, e.g. Cleric's armor choice).
// - RawEntry: a plain string ref `"name|source"`, or
//   `{ item: string, quantity?: number, displayName?: string,
//   containsValue?: number }`, or `{ equipmentType: string, quantity?:
//   number }`, or `{ special: string, quantity?: number }`.

import type { SQLiteDatabase } from 'expo-sqlite';

import { getBaseItemsByEquipmentType, getBaseItemsByNames, getItemsByNames, refName } from '@/data/queries/equipment-lookup';
import type { EquipmentLookupItem } from '@/data/queries/equipment-lookup';
import { EQUIPMENT_TYPE_LABELS } from '@/constants/equipment-types';

export type EquipmentChoiceOptionKey = 'a' | 'b' | 'c' | 'd';

export type ResolvedEquipmentEntry =
  | {
      kind: 'item';
      itemId: number;
      source: 'base_items' | 'items';
      name: string;
      quantity: number;
      displayName?: string;
      containsValueCp?: number;
    }
  | { kind: 'categoryChoice'; equipmentType: string; label: string; quantity: number }
  | { kind: 'special'; text: string; quantity: number }
  | { kind: 'unresolved'; raw: unknown };

export type EquipmentChoiceGroup =
  | { kind: 'fixed'; entries: ResolvedEquipmentEntry[] }
  | { kind: 'choice'; options: { key: EquipmentChoiceOptionKey; entries: ResolvedEquipmentEntry[] }[] };

interface RawItemRef {
  item?: string;
  equipmentType?: string;
  special?: string;
  quantity?: number;
  displayName?: string;
  containsValue?: number;
}

type RawEntry = string | RawItemRef;

type RawGroup = { _?: RawEntry[] } & Partial<Record<EquipmentChoiceOptionKey, RawEntry[]>>;

interface RawClassEquipment {
  goldAlternative?: string;
  defaultData?: RawGroup[];
}

// A pending item ref, still carrying its raw name for the batched lookup
// pass, alongside everything else needed to build the final entry once
// resolved. The other ParsedEntry variants (categoryChoice/special/
// unresolved) don't need database resolution, so they're already in their
// final ResolvedEquipmentEntry form after the first (pure) parsing pass.
interface PendingItemEntry {
  kind: 'pendingItem';
  ref: string;
  quantity: number;
  displayName?: string;
  containsValueCp?: number;
}

type ParsedEntry = PendingItemEntry | ResolvedEquipmentEntry;

// Mirrors EquipmentChoiceGroup, but entries may still be unresolved
// `pendingItem`s - the honest intermediate type between parseClassEquipment/
// parseBackgroundEquipment (pure) and resolveEquipmentItemRefs (needs a db).
export type UnresolvedEquipmentGroup =
  | { kind: 'fixed'; entries: ParsedEntry[] }
  | { kind: 'choice'; options: { key: EquipmentChoiceOptionKey; entries: ParsedEntry[] }[] };

function parseRawEntry(raw: RawEntry): ParsedEntry {
  if (typeof raw === 'string') {
    return { kind: 'pendingItem', ref: raw, quantity: 1 };
  }
  if (raw.item) {
    return {
      kind: 'pendingItem',
      ref: raw.item,
      quantity: raw.quantity ?? 1,
      displayName: raw.displayName,
      containsValueCp: raw.containsValue,
    };
  }
  if (raw.equipmentType) {
    return {
      kind: 'categoryChoice',
      equipmentType: raw.equipmentType,
      label: EQUIPMENT_TYPE_LABELS[raw.equipmentType] ?? raw.equipmentType,
      quantity: raw.quantity ?? 1,
    };
  }
  if (raw.special) {
    return { kind: 'special', text: raw.special, quantity: raw.quantity ?? 1 };
  }
  return { kind: 'unresolved', raw };
}

function parseRawGroups(groups: RawGroup[]): UnresolvedEquipmentGroup[] {
  return groups.map((group) => {
    if (group._) {
      return { kind: 'fixed', entries: group._.map(parseRawEntry) };
    }
    const optionKeys: EquipmentChoiceOptionKey[] = ['a', 'b', 'c', 'd'];
    const options = optionKeys
      .filter((key) => group[key])
      .map((key) => ({ key, entries: (group[key] as RawEntry[]).map(parseRawEntry) }));
    return { kind: 'choice', options };
  });
}

// Parses a class's raw starting_equipment JSON. Returns the choice groups
// (still carrying unresolved item refs - see resolveEquipmentItemRefs)
// plus the gold-alternative formula (undefined for classes without one,
// which shouldn't happen in the PHB, but the DSL doesn't guarantee it).
export function parseClassEquipment(raw: unknown): {
  groups: UnresolvedEquipmentGroup[];
  goldAlternative?: string;
} {
  const parsed = raw as RawClassEquipment | null;
  return { groups: parseRawGroups(parsed?.defaultData ?? []), goldAlternative: parsed?.goldAlternative };
}

// Parses a background's raw starting_equipment JSON (a bare RawGroup[], no
// wrapper object).
export function parseBackgroundEquipment(raw: unknown): UnresolvedEquipmentGroup[] {
  return parseRawGroups((raw as RawGroup[] | null) ?? []);
}

function collectPendingRefs(groups: UnresolvedEquipmentGroup[]): string[] {
  const refs: string[] = [];
  for (const group of groups) {
    const entryLists = group.kind === 'fixed' ? [group.entries] : group.options.map((option) => option.entries);
    for (const entries of entryLists) {
      for (const entry of entries) {
        if (entry.kind === 'pendingItem') refs.push(entry.ref);
      }
    }
  }
  return refs;
}

function buildLookupIndex(items: EquipmentLookupItem[]): Map<string, EquipmentLookupItem> {
  const index = new Map<string, EquipmentLookupItem>();
  // Keyed by englishName, not the (possibly translated) name - entry.ref
  // below is always the English DSL ref text.
  for (const item of items) index.set(item.englishName.toLowerCase(), item);
  return index;
}

function resolvePendingEntry(entry: PendingItemEntry, index: Map<string, EquipmentLookupItem>): ResolvedEquipmentEntry {
  const match = index.get(refName(entry.ref).toLowerCase());
  if (!match) return { kind: 'unresolved', raw: entry.ref };

  return {
    kind: 'item',
    itemId: match.id,
    source: match.source,
    name: match.name,
    quantity: entry.quantity,
    displayName: entry.displayName,
    containsValueCp: entry.containsValueCp,
  };
}

// Second pass: resolves every `pendingItem` ref across all groups to a
// concrete base_items/items row, in a couple of sequential queries (never
// Promise.all against the same connection - see data/queries/spells.ts for
// why). Refs that don't match anything become `unresolved` rather than
// throwing, since 5etools names/refs are inconsistent enough for that to
// happen - the wizard shows the raw text instead of crashing.
export async function resolveEquipmentItemRefs(
  db: SQLiteDatabase,
  groups: UnresolvedEquipmentGroup[]
): Promise<EquipmentChoiceGroup[]> {
  const refs = collectPendingRefs(groups);
  const uniqueRefs = [...new Set(refs)];

  const baseItems = await getBaseItemsByNames(db, uniqueRefs);
  const items = await getItemsByNames(db, uniqueRefs);
  const index = buildLookupIndex([...baseItems, ...items]);

  function resolveEntries(entries: ParsedEntry[]): ResolvedEquipmentEntry[] {
    return entries.map((entry) => (entry.kind === 'pendingItem' ? resolvePendingEntry(entry, index) : entry));
  }

  return groups.map((group) =>
    group.kind === 'fixed'
      ? { kind: 'fixed', entries: resolveEntries(group.entries) }
      : {
          kind: 'choice',
          options: group.options.map((option) => ({ key: option.key, entries: resolveEntries(option.entries) })),
        }
  );
}

// Resolves a `categoryChoice` entry's concrete options once the player
// opens that picker (kept separate from resolveEquipmentItemRefs since it's
// only needed on demand, not up front for every group).
export async function resolveCategoryChoiceOptions(
  db: SQLiteDatabase,
  equipmentType: string
): Promise<EquipmentLookupItem[]> {
  return getBaseItemsByEquipmentType(db, equipmentType);
}
