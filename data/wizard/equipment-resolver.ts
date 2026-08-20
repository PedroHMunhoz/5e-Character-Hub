// Parses the raw 5etools starting-equipment DSL (classes.starting_equipment,
// backgrounds.starting_equipment) into a shape the wizard's equipment step
// can render without knowing the DSL. Pure data transformation - no
// SQLiteDatabase here; item-name resolution to a concrete DB id is a
// separate second pass (resolveEquipmentItemRefs), since it needs a
// database connection and the wizard batches all the name lookups from
// every group into a couple of sequential queries.
//
// Confirmed raw shapes (verified live against the bundled db - see
// docs/TODO.md for known coverage gaps):
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

import {
  getBaseItemsByEquipmentType,
  getBaseItemsByNames,
  getItemsByNames,
  refName,
} from '@/data/queries/equipment-lookup';
import type { EquipmentLookupItem } from '@/data/queries/equipment-lookup';
import type { MultiItemPackEntry } from '@/data/queries/base-items';
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
      // Set when this entry was auto-resolved from a `categoryChoice` that
      // matched a tool category the player already chose during the
      // Antecedente step (see data/wizard/tool-equipment-overlap.ts) -
      // lets the UI explain why there's no picker here instead of a
      // second, apparently-independent choice.
      impliedByProficiency?: boolean;
      // Translated contents preview for multi-item equipment packs
      // (Explorer's Pack, ...) - see EquipmentLookupItem.entries. Absent
      // for every other item, including single-item packs (ammo bundles),
      // which resolve to their exploded component instead of the pack row.
      packEntries?: string[];
      // Resolved contents of a multi-item equipment pack (Explorer's Pack,
      // ...) - set whenever this entry's match has EquipmentLookupItem.
      // packContents. When present, assemble-character.ts grants these
      // items instead of the pack itself (itemId/name above still describe
      // the pack, for display purposes only - see resolvePendingEntry).
      packContents?: { itemId: number; source: 'base_items' | 'items'; quantity: number }[];
    }
  | {
      kind: 'categoryChoice';
      equipmentType: string;
      label: string;
      quantity: number;
      // Translated flavor text for a grant that was special-cased from a raw
      // `{item: "..."}` ref into a category picker (e.g. Acolyte's "holy
      // symbol (a gift to you when you entered the priesthood)") - see
      // EQUIPMENT_FLAVOR_TEXT_LABELS. Absent for every ordinary
      // equipmentType grant (Cleric's, tool-proficiency choices, ...).
      flavorText?: string;
    }
  | {
      kind: 'special';
      text: string;
      quantity: number;
      // Set for a bare currency-only grant with no item at all (e.g.
      // Eremita's "5 gp") - see assemble-character.ts, which sums this into
      // the character's starting currency the same way it already does for
      // `containsValueCp` on `kind: 'item'` entries (a pouch/purse with
      // money inside).
      valueCp?: number;
    }
  | {
      // A choice among a small, explicitly named set of catalog items -
      // distinct from `categoryChoice`, which offers every item in a whole
      // category (e.g. "any artisan's tool", ~17 PHB options). Used by the
      // Dwarf's "Tool Proficiency" trait (PHB p.20: choose smith's tools,
      // brewer's supplies, OR mason's tools - 3 of the ~17 artisan's tools,
      // not "any" of them) - see data/wizard/tool-proficiency-resolver.ts.
      // Options are already resolved to catalog rows (no further DB lookup
      // needed to render the picker), unlike categoryChoice.
      kind: 'namedChoice';
      label: string;
      quantity: number;
      options: { itemId: number; source: 'base_items' | 'items'; name: string }[];
    }
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
  // Bare currency-only grant with no item/equipmentType/special key at all
  // (e.g. Hermit's `{value: 500}`, PHB's "5 gp") - in copper pieces, same
  // unit as containsValue/value_cp elsewhere in the app.
  value?: number;
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

// `displayName` overrides on an `{item: "..."}` ref (e.g. "bone dice set"
// instead of the catalog's own translated "Dice Set" name) have no catalog
// row to carry a translation, so this text comes straight from the English
// 5etools dataset with no localization at all - same problem as "vehicles
// (land)"/"vehicles (water)" in tool-proficiency-resolver.ts, same fix
// shape: a small label lookup keyed by the lowercased English string,
// checked before falling through to the raw text. `describeEntry()`
// (components/wizard/equipment-choice-group.tsx) always prefers
// displayName over the resolved item's translated name, so an
// untranslated displayName silently shadows a perfectly good translation.
// Confirmed live: exclusively a background phenomenon (Acólito x2/
// Criminoso/Eremita x2/Marinheiro x2/Soldado). Values are capitalized
// (sentence case) since each renders as a standalone line in the UI, not
// mid-sentence.
const EQUIPMENT_FLAVOR_TEXT_LABELS: Record<string, string> = {
  'holy symbol (a gift to you when you entered the priesthood)':
    'Um presente que você recebeu ao entrar para o sacerdócio',
  'prayer book': 'Um livro de preces',
  'dark common clothes including a hood': 'Roupas comuns escuras, incluindo um capuz',
  'scroll case stuffed full of notes from your studies or prayers':
    'Um porta-pergaminhos cheio de anotações de seus estudos ou orações',
  'winter blanket': 'Um cobertor de inverno',
  'belaying pin': 'Uma cavilha de amarração',
  'lucky charm': 'Um amuleto da sorte',
  'bone dice set': 'Um conjunto de dados de osso',
};

function translateFlavorText(text: string): string {
  return EQUIPMENT_FLAVOR_TEXT_LABELS[text.toLowerCase()] ?? text;
}

// `{special: "..."}` entries (kind: 'special') with no matching catalog
// row used to render as untranslated, unpersisted freeform text (see
// docs/TODO.md) - confirmed live against every PHB class/background:
// classes never use this, only these 9 backgrounds do (Acólito/Artesão de
// Guilda/Artista/Charlatão/Nobre/Forasteiro/Sábio/Soldado/Órfão). Each of
// these flavor strings now has a synthetic catalog row (db/overrides/
// custom-items.json, e.g. `Sticks of Incense|PHB`) purely to carry a
// translation, weight and description through the normal item pipeline -
// this map redirects the raw special text to that row's ref so
// parseRawEntry treats it as an ordinary `pendingItem` (same resolution/
// stacking/persistence/detail-screen path as any other granted item).
// Nobre's "purse" is handled separately below (redirects to the real
// `Pouch|PHB` item, not a synthetic one, since it's the same physical
// object every other background's pouch already uses).
//
// The last 5 entries (10 Feet of String/Alms Box/Block of Incense/Censer/
// Little Bag of Sand) aren't top-level background grants - they're
// `kind: 'special'` entries nested inside a multi-item pack's packContents
// (Burglar's/Priest's/Scholar's Pack - see getMultiItemPackContents, data/
// queries/base-items.ts), reached via packContentEntryRef below instead of
// parseRawEntry. Same redirect mechanism, one level deeper.
const EQUIPMENT_SPECIAL_ITEM_REFS: Record<string, string> = {
  'sticks of incense': 'Sticks of Incense|PHB',
  vestments: 'Vestments|PHB',
  'prayer wheel': 'Prayer Wheel|PHB',
  'stoppered bottles filled with colored liquid': 'Stoppered Bottles Filled with Colored Liquid|PHB',
  'set of weighted dice': 'Set of Weighted Dice|PHB',
  'deck of marked cards': 'Deck of Marked Cards|PHB',
  'signet ring of an imaginary duke': 'Signet Ring of an Imaginary Duke|PHB',
  'the favor of an admirer (love letter, lock of hair, or trinket)': 'Favor of an Admirer|PHB',
  'letter of introduction from your guild': 'Letter of Introduction from Your Guild|PHB',
  'scroll of pedigree': 'Scroll of Pedigree|PHB',
  'trophy from an animal you killed': 'Trophy from an Animal You Killed|PHB',
  quill: 'Quill|PHB',
  'small knife': 'Small Knife|PHB',
  'letter from a dead colleague posing a question you have not yet been able to answer':
    'Letter from a Dead Colleague|PHB',
  'insignia of rank': 'Insignia of Rank|PHB',
  'trophy taken from a fallen enemy (a dagger, broken blade, or piece of a banner)':
    'Trophy Taken from a Fallen Enemy|PHB',
  'map of the city you grew up in': 'Map of the City You Grew Up In|PHB',
  'pet mouse': 'Pet Mouse|PHB',
  'token to remember your parents by': 'Token to Remember Your Parents By|PHB',
  '10 feet of string': '10 Feet of String|PHB',
  'alms box': 'Alms Box|PHB',
  'block of incense': 'Block of Incense|PHB',
  censer: 'Censer|PHB',
  'little bag of sand': 'Little Bag of Sand|PHB',
};

// PHB's "5 gp" is in copper pieces here (same unit as containsValue/
// value_cp elsewhere in the app) - divide by 100 to show as "X po".
function formatGoldGrant(valueCp: number): string {
  return `${valueCp / 100} po`;
}

function parseRawEntry(raw: RawEntry): ParsedEntry {
  if (typeof raw === 'string') {
    return { kind: 'pendingItem', ref: raw, quantity: 1 };
  }
  if (raw.item) {
    // "Holy symbol" (Acólito's fixed grant) has no matching catalog row -
    // only the specific named variants do (Amuleto/Emblema/Relicário/
    // Sinete/Sino) - so it can never resolve as a pendingItem (would fall
    // to 'unresolved' and leak the raw "holy symbol|phb" ref, pipe and
    // all). Special-cased into the same categoryChoice picker Cleric's
    // `focusSpellcastingHoly` equipmentType grant already uses, carrying
    // the "gift" flavor text along as a translated caption instead of
    // silently dropping it.
    if (refName(raw.item).toLowerCase() === 'holy symbol') {
      return {
        kind: 'categoryChoice',
        equipmentType: 'focusSpellcastingHoly',
        label: EQUIPMENT_TYPE_LABELS.focusSpellcastingHoly ?? 'focusSpellcastingHoly',
        quantity: raw.quantity ?? 1,
        flavorText: raw.displayName ? translateFlavorText(raw.displayName) : undefined,
      };
    }
    return {
      kind: 'pendingItem',
      ref: raw.item,
      quantity: raw.quantity ?? 1,
      displayName: raw.displayName ? translateFlavorText(raw.displayName) : undefined,
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
    // Nobre's "purse" is the only PHB background that pairs `special` with
    // `containsValue` instead of a real item ref - same real object as the
    // other 11 backgrounds' `{item: "pouch|phb", containsValue: ...}` grant
    // (a pouch/purse with gold inside), just modeled with a different
    // flavor name in the English dataset. Redirect to the real Pouch
    // catalog item (already translated "Algibeira", same as the flavor
    // text below) so the contained gold actually resolves as a normal
    // `kind: 'item'` entry and gets summed by assemble-character.ts, same
    // as everyone else's pouch - a `special` entry's containsValue was
    // otherwise silently discarded (parseRawEntry never read it).
    const specialKey = raw.special.toLowerCase();
    if (specialKey === 'purse' && raw.containsValue) {
      return {
        kind: 'pendingItem',
        ref: 'pouch|phb',
        quantity: raw.quantity ?? 1,
        containsValueCp: raw.containsValue,
      };
    }
    // Redirect to the synthetic catalog row for this flavor text (see
    // EQUIPMENT_SPECIAL_ITEM_REFS above) so it resolves/persists/displays
    // like any other granted item instead of falling to the freeform,
    // unpersisted `kind: 'special'` text below.
    const specialItemRef = EQUIPMENT_SPECIAL_ITEM_REFS[specialKey];
    if (specialItemRef) {
      return { kind: 'pendingItem', ref: specialItemRef, quantity: raw.quantity ?? 1 };
    }
    return { kind: 'special', text: translateFlavorText(raw.special), quantity: raw.quantity ?? 1 };
  }
  // Bare currency-only grant, no item/equipmentType/special key at all
  // (e.g. Eremita's `{value: 500}`, PHB's "5 gp") - the only PHB DSL entry
  // shaped like this. `valueCp` lets assemble-character.ts sum this into
  // starting currency the same way it already does for `containsValueCp`.
  if (typeof raw.value === 'number') {
    return { kind: 'special', text: formatGoldGrant(raw.value), quantity: 1, valueCp: raw.value };
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

// Substitutes a single-item pack (ammo, Ball Bearings, Caltrops, Iron
// Spikes - sold as a pack for shopping convenience only) for N of its
// underlying component item. Falls back to the pack itself if the component
// name didn't resolve (shouldn't happen for PHB data), so nothing is
// silently dropped. Shared between the top-level ref (resolvePendingEntry)
// and each item inside a multi-item pack's contents (resolvePackContentRef)
// - the Burglar's Pack's "ball bearings (bag of 1,000)" entry is itself a
// single-item pack, so the same substitution applies one level down.
// Exported for data/queries/shop-catalog.ts - same substitution needed when
// resolving a purchasable pack row to what it actually grants.
export function substituteSingleItemPack(
  match: EquipmentLookupItem,
  index: Map<string, EquipmentLookupItem>
): { resolved: EquipmentLookupItem; quantityMultiplier: number } {
  const pack = match.singleItemPack;
  const component = pack ? index.get(refName(pack.itemRef).toLowerCase()) : undefined;
  return component
    ? { resolved: component, quantityMultiplier: pack!.quantity }
    : { resolved: match, quantityMultiplier: 1 };
}

// A pack-content entry's own ref: either its `itemRef` directly (kind
// 'item'), or - for a `kind: 'special'` entry like Priest's Pack's "alms
// box" - the same EQUIPMENT_SPECIAL_ITEM_REFS redirect already used for
// top-level `special` grants (see parseRawEntry above), so these resolve
// through the identical synthetic-catalog-row mechanism instead of being
// dropped. Undefined when there's no catalog row and no redirect for it.
// Exported for data/queries/shop-catalog.ts, which needs the identical
// resolution when a multi-item equipment pack (Explorer's Pack, ...) is
// purchased instead of granted by the wizard's starting-equipment step.
export function packContentEntryRef(pc: MultiItemPackEntry): string | undefined {
  return pc.kind === 'item' ? pc.itemRef : EQUIPMENT_SPECIAL_ITEM_REFS[pc.text.toLowerCase()];
}

function resolvePackContentRef(
  pc: MultiItemPackEntry,
  index: Map<string, EquipmentLookupItem>
): { itemId: number; source: 'base_items' | 'items'; quantity: number } | undefined {
  const ref = packContentEntryRef(pc);
  if (!ref) return undefined;
  const innerMatch = index.get(refName(ref).toLowerCase());
  if (!innerMatch) return undefined;
  const { resolved, quantityMultiplier } = substituteSingleItemPack(innerMatch, index);
  return { itemId: resolved.id, source: resolved.source, quantity: pc.quantity * quantityMultiplier };
}

function resolvePendingEntry(entry: PendingItemEntry, index: Map<string, EquipmentLookupItem>): ResolvedEquipmentEntry {
  const match = index.get(refName(entry.ref).toLowerCase());
  if (!match) return { kind: 'unresolved', raw: entry.ref };

  const { resolved, quantityMultiplier } = substituteSingleItemPack(match, index);

  // Multi-item pack (Explorer's Pack, ...) - resolve its contents to
  // concrete catalog items so assemble-character.ts can grant those instead
  // of the pack row itself. Checked on `match`, not `resolved` - packContents
  // and singleItemPack are mutually exclusive per the dataset (a pack is
  // either "N of one item" or "a bundle of different items"), so match is
  // never substituted when it has packContents.
  const packContents = match.packContents
    ?.map((pc) => resolvePackContentRef(pc, index))
    .filter((pc): pc is { itemId: number; source: 'base_items' | 'items'; quantity: number } => pc !== undefined)
    .map((pc) => ({ ...pc, quantity: pc.quantity * entry.quantity }));

  return {
    kind: 'item',
    itemId: resolved.id,
    source: resolved.source,
    name: resolved.name,
    quantity: entry.quantity * quantityMultiplier,
    displayName: entry.displayName,
    containsValueCp: entry.containsValueCp,
    packEntries: resolved.entries,
    packContents,
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
  let allMatched = [...baseItems, ...items];
  let index = buildLookupIndex(allMatched);

  // Any resolved pack - a single-item pack (see EquipmentLookupItem.
  // singleItemPack) or a multi-item pack's contents (see packContents) -
  // needs its referenced item(s) resolved too, so resolvePendingEntry can
  // substitute/expand them. Contents can themselves reference a single-item
  // pack (the Burglar's Pack's "ball bearings (bag of 1,000)" entry is
  // itself a 1000-unit pack of Ball Bearing), so this loops until a pass
  // finds nothing new to resolve rather than assuming one fixed depth -
  // bounded to 3 passes, well above anything the PHB dataset needs.
  // Sequential, not Promise.all, against the same connection (see
  // data/queries/spells.ts).
  for (let pass = 0; pass < 3; pass++) {
    const nextRefs = allMatched
      .flatMap((matchedItem) => [
        matchedItem.singleItemPack?.itemRef,
        ...(matchedItem.packContents?.map(packContentEntryRef) ?? []),
      ])
      .filter((ref): ref is string => ref !== undefined && !index.has(refName(ref).toLowerCase()));
    const uniqueNextRefs = [...new Set(nextRefs)];
    if (uniqueNextRefs.length === 0) break;

    const nextBaseItems = await getBaseItemsByNames(db, uniqueNextRefs);
    const nextItems = await getItemsByNames(db, uniqueNextRefs);
    allMatched = [...allMatched, ...nextBaseItems, ...nextItems];
    index = buildLookupIndex(allMatched);
  }

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
