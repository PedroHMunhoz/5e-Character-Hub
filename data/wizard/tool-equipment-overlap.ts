// Bridges the Antecedente step's tool-proficiency choices
// (data/wizard/tool-proficiency-resolver.ts, resolved into
// draft.toolProficiencies) with the Equipamento step's starting-equipment
// choices (data/wizard/equipment-resolver.ts). Several PHB backgrounds/
// classes grant a tool-category proficiency (e.g. "one type of artisan's
// tools") AND a starting-equipment item from that exact same category (e.g.
// Folk Hero's `{equipmentType: "toolArtisan"}`) - by RAW these are meant to
// be the same physical tool, but the two steps resolve independently, so
// without this bridge the Equipamento step asks the player to pick a tool
// a second time as if unrelated to the choice they just made.

import type { ToolCategory, ToolItem } from '@/data/queries/tools';
import { normalizeToolCategoryKey } from '@/data/queries/tools';
import type { EquipmentChoiceGroup, EquipmentChoiceOptionKey, ResolvedEquipmentEntry } from './equipment-resolver';

// Keys ToolItem by `${source}:${id}` so base_items/items id collisions
// (see docs/wizard-todo.md) never conflate two different catalog rows.
function toolItemKey(source: 'base_items' | 'items', id: number): string {
  return `${source}:${id}`;
}

// Groups the concrete tools already granted (draft.toolProficiencies, only
// its `item` entries - `categoryChoice`/`special`/`unresolved` entries
// shouldn't reach here since the Antecedente step resolves every
// categoryChoice before leaving) by ToolCategory, so the Equipamento step
// can look up "did the player already pick an artisan's tool?" in O(1).
export function categorizeGrantedTools(
  toolProficiencies: ResolvedEquipmentEntry[],
  allTools: ToolItem[]
): Map<ToolCategory, ToolItem[]> {
  const toolsByKey = new Map(allTools.map((tool) => [toolItemKey(tool.source, tool.id), tool]));
  const result = new Map<ToolCategory, ToolItem[]>();

  for (const entry of toolProficiencies) {
    if (entry.kind !== 'item') continue;
    const tool = toolsByKey.get(toolItemKey(entry.source, entry.itemId));
    if (!tool) continue;
    const existing = result.get(tool.category);
    if (existing) existing.push(tool);
    else result.set(tool.category, [tool]);
  }

  return result;
}

function toolCategoryOf(
  entry: ResolvedEquipmentEntry,
  toolCategoryByKey: Map<string, ToolCategory>
): ToolCategory | null {
  if (entry.kind !== 'item') return null;
  return toolCategoryByKey.get(toolItemKey(entry.source, entry.itemId)) ?? null;
}

function reconcileEntry(
  entry: ResolvedEquipmentEntry,
  grantedByCategory: Map<ToolCategory, ToolItem[]>
): ResolvedEquipmentEntry {
  if (entry.kind !== 'categoryChoice') return entry;
  const category = normalizeToolCategoryKey(entry.equipmentType);
  if (!category) return entry;
  const granted = grantedByCategory.get(category);
  // Only auto-resolve when exactly one tool of this category was granted -
  // with more than one (e.g. Bard's "three musical instruments"), there's
  // no single right answer, so leave the picker as-is.
  if (!granted || granted.length !== 1) return entry;
  const [tool] = granted;
  return {
    kind: 'item',
    itemId: tool.id,
    source: tool.source,
    name: tool.name,
    quantity: entry.quantity,
    impliedByProficiency: true,
  };
}

export interface ReconciledEquipmentGroup {
  group: EquipmentChoiceGroup;
  // Set when one of the group's `choice` options collapsed to a single
  // item that exactly matches an already-granted tool (e.g. Soldier's
  // "dice set" option matching a Dice Set proficiency) - the caller can use
  // this to pre-select that option without forcing it.
  autoSelectOptionKey?: EquipmentChoiceOptionKey;
}

// Reconciles a single resolved equipment group (already past
// resolveEquipmentItemRefs) against the tools the player already chose in
// the Antecedente step.
export function reconcileEquipmentGroup(
  group: EquipmentChoiceGroup,
  grantedByCategory: Map<ToolCategory, ToolItem[]>,
  toolCategoryByKey: Map<string, ToolCategory>
): ReconciledEquipmentGroup {
  if (group.kind === 'fixed') {
    return { group: { kind: 'fixed', entries: group.entries.map((entry) => reconcileEntry(entry, grantedByCategory)) } };
  }

  const options = group.options.map((option) => ({
    key: option.key,
    entries: option.entries.map((entry) => reconcileEntry(entry, grantedByCategory)),
  }));

  // Only auto-select when an option resolves to exactly one item and that
  // item is itself one of the already-granted tools - a curated a/b choice
  // (e.g. Soldier's gaming set) doesn't always cover every tool in its
  // category, so this only fires when the granted tool happens to be one
  // of the offered options.
  const autoSelectOptionKey = options.find((option) => {
    if (option.entries.length !== 1) return false;
    const category = toolCategoryOf(option.entries[0], toolCategoryByKey);
    if (!category) return false;
    const granted = grantedByCategory.get(category);
    if (!granted) return false;
    const entry = option.entries[0];
    if (entry.kind !== 'item') return false;
    return granted.some((tool) => tool.source === entry.source && tool.id === entry.itemId);
  })?.key;

  return { group: { kind: 'choice', options }, autoSelectOptionKey };
}

export function buildToolCategoryIndex(allTools: ToolItem[]): Map<string, ToolCategory> {
  return new Map(allTools.map((tool) => [toolItemKey(tool.source, tool.id), tool.category]));
}
