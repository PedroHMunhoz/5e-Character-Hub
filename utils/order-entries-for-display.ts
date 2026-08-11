import type { ResolvedEquipmentEntry } from '@/data/wizard/equipment-resolver';

// Reorders entries so every fixed/text row (item/special/unresolved) shows
// before any interactive categoryChoice picker - a picker stranded between
// two lines of plain text reads as lost/misplaced. Pairs each entry with
// its original array index (a stable sort keeps relative order within each
// group) so callers can keep using that index as their entryKey - the
// state that key points at (toolCategoryChoices in app/wizard/background.tsx,
// categoryChoices in app/wizard/equipment.tsx) is keyed by original
// position, not display position.
export function orderEntriesForDisplay(
  entries: ResolvedEquipmentEntry[]
): { entry: ResolvedEquipmentEntry; index: number }[] {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => Number(a.entry.kind === 'categoryChoice') - Number(b.entry.kind === 'categoryChoice'));
}
