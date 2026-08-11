import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { RadioToggle } from '@/components/character/radio-toggle';
import { SelectField } from '@/components/character/select-field';
import { ThemedText } from '@/components/themed-text';
import type { EquipmentLookupItem } from '@/data/queries/equipment-lookup';
import { resolveCategoryChoiceOptions } from '@/data/wizard/equipment-resolver';
import type { EquipmentChoiceGroup, ResolvedEquipmentEntry } from '@/data/wizard/equipment-resolver';
import { useThemeColor } from '@/hooks/use-theme-color';
import { orderEntriesForDisplay } from '@/utils/order-entries-for-display';
import { sortByLocalizedName } from '@/utils/sort-by-name';

interface EquipmentChoiceGroupViewProps {
  group: EquipmentChoiceGroup;
  groupKey: string;
  selectedOptionKey: string | null;
  onSelectOption: (optionKey: string) => void;
  categoryChoices: Record<string, EquipmentLookupItem>;
  onChangeCategoryChoice: (entryKey: string, item: EquipmentLookupItem) => void;
}

function describeEntry(entry: ResolvedEquipmentEntry): string {
  if (entry.kind === 'item') {
    const label = entry.displayName ?? entry.name;
    const quantified = entry.quantity > 1 ? `${entry.quantity}x ${label}` : label;
    return entry.impliedByProficiency ? `${quantified} (já escolhida no passo anterior)` : quantified;
  }
  if (entry.kind === 'special') return entry.text;
  if (entry.kind === 'categoryChoice') return entry.label;
  return String(entry.raw);
}

function EntryRow({
  entry,
  entryKey,
  categoryChoices,
  onChangeCategoryChoice,
  interactive,
}: {
  entry: ResolvedEquipmentEntry;
  entryKey: string;
  categoryChoices: Record<string, EquipmentLookupItem>;
  onChangeCategoryChoice: (entryKey: string, item: EquipmentLookupItem) => void;
  // Whether this entry's parent option is currently selected - a
  // categoryChoice only shows its live picker once selected (every option
  // in a group renders now, not just the chosen one, so an unselected
  // option's categoryChoice just shows its plain label instead).
  interactive: boolean;
}) {
  const db = useSQLiteContext();
  const [options, setOptions] = useState<EquipmentLookupItem[] | null>(null);

  useEffect(() => {
    if (entry.kind !== 'categoryChoice' || !interactive) return;
    let cancelled = false;
    resolveCategoryChoiceOptions(db, entry.equipmentType).then((items) => {
      if (!cancelled) setOptions(items);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, entry.kind, interactive]);

  if (entry.kind === 'categoryChoice') {
    if (!interactive) {
      return <ThemedText style={styles.entryText}>{entry.label}</ThemedText>;
    }
    const selected = categoryChoices[entryKey];
    return (
      <SelectField
        label={`Escolha${entry.quantity > 1 ? ` ${entry.quantity}x` : ''}: ${entry.label}`}
        value={selected ? String(selected.id) : ''}
        options={sortByLocalizedName(options ?? []).map((item) => ({ value: String(item.id), label: item.name }))}
        onChange={(value) => {
          const item = (options ?? []).find((option) => option.id === Number(value));
          if (item) onChangeCategoryChoice(entryKey, item);
        }}
      />
    );
  }

  if (entry.kind === 'unresolved') {
    return <ThemedText style={styles.entryText}>{String(entry.raw)}</ThemedText>;
  }

  return <ThemedText style={styles.entryText}>{describeEntry(entry)}</ThemedText>;
}

export function EquipmentChoiceGroupView({
  group,
  groupKey,
  selectedOptionKey,
  onSelectOption,
  categoryChoices,
  onChangeCategoryChoice,
}: EquipmentChoiceGroupViewProps) {
  const goldColor = useThemeColor({}, 'gold');
  const dimColor = useThemeColor({}, 'icon');

  if (group.kind === 'fixed') {
    return (
      <View style={styles.container}>
        {orderEntriesForDisplay(group.entries).map(({ entry, index }) => (
          <EntryRow
            key={index}
            entry={entry}
            entryKey={`${groupKey}-fixed-${index}`}
            categoryChoices={categoryChoices}
            onChangeCategoryChoice={onChangeCategoryChoice}
            interactive
          />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {group.options.map((option) => {
        const selected = selectedOptionKey === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => onSelectOption(option.key)}
            style={[styles.optionCard, { borderColor: selected ? goldColor : dimColor }]}
          >
            <View style={styles.optionHeader}>
              <RadioToggle selected={selected} onSelect={() => onSelectOption(option.key)} />
              <View style={styles.optionEntries}>
                <ThemedText style={styles.optionKeyLabel}>Opção {option.key.toUpperCase()}</ThemedText>
                {orderEntriesForDisplay(option.entries).map(({ entry, index }) => (
                  <EntryRow
                    key={index}
                    entry={entry}
                    entryKey={`${groupKey}-${option.key}-${index}`}
                    categoryChoices={categoryChoices}
                    onChangeCategoryChoice={onChangeCategoryChoice}
                    interactive={selected}
                  />
                ))}
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  entryText: {
    fontSize: 15,
  },
  optionCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  optionEntries: {
    flex: 1,
    gap: 4,
  },
  optionKeyLabel: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
  },
});
