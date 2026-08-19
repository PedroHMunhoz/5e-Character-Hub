import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { SelectField } from '@/components/character/select-field';
import { ThemedText } from '@/components/themed-text';
import { getToolItemsByCategory, normalizeToolCategoryKey, type ToolItem } from '@/data/queries/tools';
import type { ResolvedEquipmentEntry } from '@/data/wizard/equipment-resolver';
import { orderEntriesForDisplay } from '@/utils/order-entries-for-display';
import { sortByLocalizedName } from '@/utils/sort-by-name';

// Minimal shape both a categoryChoice's DB-fetched ToolItem and a
// namedChoice's already-resolved option satisfy - only `.id`/`.source`/
// `.name` are ever read back out (see background.tsx's finalToolEntries).
export type ChosenTool = { id: number; source: 'base_items' | 'items'; name: string };

interface ToolChoiceListProps {
  entries: ResolvedEquipmentEntry[];
  // Keyed by entry index (as string) - only set once the player has picked
  // a concrete tool for that entry's categoryChoice/namedChoice.
  categoryChoices: Record<string, ChosenTool>;
  onChangeCategoryChoice: (entryKey: string, item: ChosenTool) => void;
}

export function ToolChoiceList({ entries, categoryChoices, onChangeCategoryChoice }: ToolChoiceListProps) {
  if (entries.length === 0) {
    return <ThemedText style={styles.emptyText}>Nenhuma proficiência em ferramentas.</ThemedText>;
  }

  return (
    <View style={styles.container}>
      {orderEntriesForDisplay(entries).map(({ entry, index }) => {
        const entryKey = String(index);
        if (entry.kind === 'item') {
          return (
            <ThemedText key={entryKey} style={styles.fixedEntry}>
              • {entry.name}
            </ThemedText>
          );
        }
        if (entry.kind === 'categoryChoice') {
          return (
            <CategoryChoicePicker
              key={entryKey}
              equipmentType={entry.equipmentType}
              selectedItemId={categoryChoices[entryKey]?.id ?? null}
              onChange={(item) => onChangeCategoryChoice(entryKey, item)}
            />
          );
        }
        if (entry.kind === 'namedChoice') {
          return (
            <NamedChoicePicker
              key={entryKey}
              options={entry.options}
              selectedItemId={categoryChoices[entryKey]?.id ?? null}
              onChange={(item) => onChangeCategoryChoice(entryKey, item)}
            />
          );
        }
        return (
          <ThemedText key={entryKey} style={styles.fixedEntry}>
            • {entry.kind === 'special' ? entry.text : String(entry.raw)}
          </ThemedText>
        );
      })}
    </View>
  );
}

function CategoryChoicePicker({
  equipmentType,
  selectedItemId,
  onChange,
}: {
  equipmentType: string;
  selectedItemId: number | null;
  onChange: (item: ToolItem) => void;
}) {
  const db = useSQLiteContext();
  const [options, setOptions] = useState<ToolItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const category = normalizeToolCategoryKey(equipmentType);
    if (!category) {
      setOptions([]);
      return;
    }
    getToolItemsByCategory(db, category).then((items) => {
      if (!cancelled) setOptions(items);
    });
    return () => {
      cancelled = true;
    };
  }, [db, equipmentType]);

  if (options === null) return null;

  return (
    <SelectField
      label="Escolha a ferramenta"
      value={selectedItemId !== null ? String(selectedItemId) : ''}
      options={sortByLocalizedName(options).map((item) => ({ value: String(item.id), label: item.name }))}
      onChange={(value) => {
        const item = options.find((option) => option.id === Number(value));
        if (item) onChange(item);
      }}
    />
  );
}

// Same picker UI as CategoryChoicePicker, but the options are already
// resolved catalog rows (see ResolvedEquipmentEntry's `namedChoice` variant)
// - no DB fetch needed, unlike a categoryChoice's whole-category lookup.
function NamedChoicePicker({
  options,
  selectedItemId,
  onChange,
}: {
  options: { itemId: number; source: 'base_items' | 'items'; name: string }[];
  selectedItemId: number | null;
  onChange: (item: ChosenTool) => void;
}) {
  const sorted = [...options].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return (
    <SelectField
      label="Escolha a ferramenta"
      value={selectedItemId !== null ? String(selectedItemId) : ''}
      options={sorted.map((option) => ({ value: String(option.itemId), label: option.name }))}
      onChange={(value) => {
        const option = options.find((o) => o.itemId === Number(value));
        if (option) onChange({ id: option.itemId, source: option.source, name: option.name });
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  fixedEntry: {
    fontSize: 15,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
