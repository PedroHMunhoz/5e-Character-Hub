import { Pressable, StyleSheet, View } from 'react-native';

import { EditableStat } from '@/components/character/editable-stat';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export const USES_COLUMN_WIDTH = 104;
export const RECOVERY_COLUMN_WIDTH = 56;

interface FeatureItemRowProps {
  name: string;
  alternate?: boolean;
  maxUses?: string;
  usesCurrent?: string;
  onUsesChange?: (value: string) => void;
  recovery?: string;
}

export function FeatureItemRow({
  name,
  alternate = false,
  maxUses,
  usesCurrent,
  onUsesChange,
  recovery,
}: FeatureItemRowProps) {
  const tintColor = useThemeColor({}, 'tint');

  const maxUsesNum = parseInt(maxUses ?? '0', 10) || 0;
  const usesCurrentNum = parseInt(usesCurrent ?? '0', 10) || 0;

  function handleDecrement() {
    onUsesChange?.(String(Math.max(usesCurrentNum - 1, 0)));
  }

  function handleIncrement() {
    onUsesChange?.(String(Math.min(usesCurrentNum + 1, maxUsesNum)));
  }

  return (
    <View style={[styles.row, alternate ? styles.rowAlternate : null]}>
      <ThemedText style={styles.name} numberOfLines={1}>
        {name}
      </ThemedText>
      <View style={[styles.usesColumn, { width: USES_COLUMN_WIDTH }]}>
        {maxUses ? (
          <View style={styles.stepper}>
            <Pressable onPress={handleDecrement} style={[styles.stepperButton, { borderColor: tintColor }]} hitSlop={4}>
              <ThemedText style={[styles.stepperButtonLabel, { color: tintColor }]}>−</ThemedText>
            </Pressable>
            <EditableStat
              value={usesCurrent ?? '0'}
              onChangeText={onUsesChange ?? (() => {})}
              keyboardType="number-pad"
              style={styles.usesItem}
              inputStyle={styles.usesInput}
            />
            <ThemedText style={styles.usesMax}>/{maxUses}</ThemedText>
            <Pressable onPress={handleIncrement} style={[styles.stepperButton, { borderColor: tintColor }]} hitSlop={4}>
              <ThemedText style={[styles.stepperButtonLabel, { color: tintColor }]}>+</ThemedText>
            </Pressable>
          </View>
        ) : null}
      </View>
      <View style={[styles.recoveryColumn, { width: RECOVERY_COLUMN_WIDTH }]}>
        <ThemedText style={styles.recoveryLabel}>{recovery ?? '-'}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  rowAlternate: {
    backgroundColor: 'rgba(127,127,127,0.08)',
  },
  name: {
    flex: 1,
    minWidth: 0,
  },
  usesColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveryColumn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recoveryLabel: {
    fontSize: 13,
    opacity: 0.8,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepperButton: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonLabel: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 15,
  },
  usesItem: {
    minWidth: 0,
  },
  usesInput: {
    width: 30,
    height: 26,
    fontSize: 13,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  usesMax: {
    fontSize: 13,
    opacity: 0.8,
  },
});
