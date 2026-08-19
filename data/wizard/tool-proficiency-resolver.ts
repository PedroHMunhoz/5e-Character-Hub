// Parses the raw tool-proficiency DSL shared by classes
// (starting_proficiencies.toolProficiencies) and backgrounds
// (tool_proficiencies) - both are an array of objects whose keys are either
// an exact tool name mapped to `true` (a fixed grant, e.g. `{"thieves'
// tools": true}`) or an "anyX" category key mapped to a choice count (e.g.
// `{"anyGamingSet": 1}`). Confirmed live against both classes.starting_
// proficiencies and backgrounds.tool_proficiencies (see db/schema.sql and
// docs/TODO.md).
//
// Reuses ResolvedEquipmentEntry's `item`/`categoryChoice`/`unresolved`
// variants from the equipment resolver rather than a parallel type - a
// resolved tool proficiency is the same shape as a resolved equipment
// entry (a concrete catalog row, or a category the player still has to
// pick within).

import type { SQLiteDatabase } from 'expo-sqlite';

import { getAllToolItems, normalizeToolCategoryKey } from '@/data/queries/tools';
import type { ResolvedEquipmentEntry } from './equipment-resolver';

// The Dwarf's "Tool Proficiency" trait (PHB p.20) is the only PHB use of
// this shape in tool_proficiencies - `{choose: {from: [...]}}`, an explicit
// named list rather than a fixed grant (`true`) or a category count
// (number). Resolved as `kind: 'namedChoice'`, not `categoryChoice` - the
// PHB list (3 of the ~17 artisan's tools) is narrower than the "any
// artisan's tool" category. Present in non-PHB backgrounds too (e.g. Tomb
// of Annihilation's Archaeologist), but the wizard only reads source='PHB'
// data, where it's exclusive to this one race trait.
interface RawToolChooseValue {
  from: string[];
}

type RawToolProficiencyGroup = Record<string, boolean | number | RawToolChooseValue>;

// Vehicle proficiency isn't a tool at all (no catalog row, not a
// artisan/instrument/gamingSet category) - PHB backgrounds (Folk Hero,
// Soldier, Sailor) grant it as its own DSL key inside tool_proficiencies.
// Resolved as a 'special' (display-only) entry purely to localize the text;
// like every other 'special'/'unresolved' entry, it isn't persisted onto
// the finished character (see docs/TODO.md).
const VEHICLE_PROFICIENCY_LABELS: Record<string, string> = {
  'vehicles (land)': 'Veículos (terrestres)',
  'vehicles (water)': 'Veículos (aquáticos)',
};

export async function resolveToolProficiencies(db: SQLiteDatabase, raw: unknown): Promise<ResolvedEquipmentEntry[]> {
  const groups = (raw as RawToolProficiencyGroup[] | null) ?? [];
  const allTools = await getAllToolItems(db);
  // The DSL keys being matched below (e.g. "thieves' tools") are always
  // English, so the lookup map must be keyed by englishName, not the
  // localized display name.
  const byName = new Map(allTools.map((tool) => [tool.englishName.toLowerCase(), tool]));

  const entries: ResolvedEquipmentEntry[] = [];
  for (const group of groups) {
    for (const [key, value] of Object.entries(group)) {
      if (key === 'choose' && typeof value === 'object' && value !== null && 'from' in value) {
        const options = (value as RawToolChooseValue).from
          .map((name) => byName.get(name.toLowerCase()))
          .filter((tool): tool is (typeof allTools)[number] => tool != null)
          .map((tool) => ({ itemId: tool.id, source: tool.source, name: tool.name }));
        entries.push(
          options.length > 0
            ? { kind: 'namedChoice', label: 'ferramenta (à escolha)', quantity: 1, options }
            : { kind: 'unresolved', raw: value }
        );
        continue;
      }

      const category = normalizeToolCategoryKey(key);
      if (category) {
        entries.push({
          kind: 'categoryChoice',
          equipmentType: key,
          label: key,
          quantity: typeof value === 'number' ? value : 1,
        });
        continue;
      }

      const vehicleLabel = VEHICLE_PROFICIENCY_LABELS[key.toLowerCase()];
      if (vehicleLabel) {
        entries.push({ kind: 'special', text: vehicleLabel, quantity: 1 });
        continue;
      }

      const match = byName.get(key.toLowerCase());
      entries.push(
        match
          ? { kind: 'item', itemId: match.id, source: match.source, name: match.name, quantity: 1 }
          : { kind: 'unresolved', raw: key }
      );
    }
  }
  return entries;
}
