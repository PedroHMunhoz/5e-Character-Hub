import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface SelectFieldOption<T extends string> {
  value: T;
  label: string;
}

interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  options: SelectFieldOption<T>[];
  onChange: (value: T) => void;
  // When true, tapping the already-selected option again clears it
  // (onChange('')) instead of just re-confirming it - lets the wizard's
  // ability-score pickers (components/wizard/value-pool-assigner.tsx) free
  // up a value for reassignment to another ability. Off by default since
  // most pickers (race, class, ...) have no "unselected" state to return to.
  allowClear?: boolean;
}

export function SelectField<T extends string>({ label, value, options, onChange, allowClear }: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const goldColor = useThemeColor({}, 'gold');
  const selected = options.find((option) => option.value === value);

  return (
    <View>
      <Pressable onPress={() => setOpen(true)} style={[styles.field, { borderColor: goldColor }]}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        <View style={styles.valueRow}>
          <ThemedText style={styles.value}>{selected?.label ?? value}</ThemedText>
          <MaterialCommunityIcons name="chevron-down" size={18} color={goldColor} />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable onPress={() => {}} style={[styles.optionsCard, { borderColor: goldColor }]}>
            <ThemedView style={styles.optionsCardInner}>
              {/* Some pickers (races, classes, spells, ...) can have dozens
                  of options - without a bounded, scrollable list this modal
                  overflowed the screen on real devices with no way to reach
                  the rest or dismiss it. */}
              <ScrollView style={styles.optionsScroll} showsVerticalScrollIndicator>
                {options.map((option) => (
                  <Pressable
                    key={option.value}
                    style={styles.option}
                    onPress={() => {
                      const clearing = allowClear && option.value === value;
                      onChange(clearing ? ('' as T) : option.value);
                      setOpen(false);
                    }}
                  >
                    <ThemedText style={option.value === value ? styles.optionSelected : undefined}>
                      {option.label}
                    </ThemedText>
                    {option.value === value ? (
                      <MaterialCommunityIcons name="check" size={16} color={goldColor} />
                    ) : null}
                  </Pressable>
                ))}
              </ScrollView>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, opacity: 0.7 },
  field: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  value: { fontSize: 16, fontWeight: '700' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  optionsCard: {
    width: '100%',
    maxWidth: 320,
    maxHeight: '70%',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  optionsCardInner: {
    width: '100%',
  },
  optionsScroll: {
    flexGrow: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionSelected: { fontWeight: '700' },
});
