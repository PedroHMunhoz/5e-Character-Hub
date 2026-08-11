import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { SelectField } from '@/components/character/select-field';
import { ThemedText } from '@/components/themed-text';
import { getToolItemsByCategory, normalizeToolCategoryKey, type ToolItem } from '@/data/queries/tools';
import type { ResolvedEquipmentEntry } from '@/data/wizard/equipment-resolver';
import { orderEntriesForDisplay } from '@/utils/order-entries-for-display';
import { sortByLocalizedName } from '@/utils/sort-by-name';

interface ToolChoiceListProps {
  entries: ResolvedEquipmentEntry[];
  // Keyed by entry index (as string) - only set once the player has picked
  // a concrete tool for that entry's categoryChoice.
  categoryChoices: Record<string, ToolItem>;
  onChangeCategoryChoice: (entryKey: string, item: ToolItem) => void;
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
