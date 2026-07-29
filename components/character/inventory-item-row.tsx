import { Pressable, StyleSheet, View } from 'react-native';

import { EditableStat } from '@/components/character/editable-stat';
import { ProficiencyDot } from '@/components/character/proficiency-dot';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface InventoryItemRowProps {
  name: string;
  subtitle?: string;
  quantity: string;
  onQuantityChange: (value: string) => void;
  equipped: boolean;
  onToggleEquipped: () => void;
  alternate?: boolean;
}

export function InventoryItemRow({
  name,
  subtitle,
  quantity,
  onQuantityChange,
  equipped,
  onToggleEquipped,
  alternate = false,
}: InventoryItemRowProps) {
  const tintColor = useThemeColor({}, 'tint');

  const quantityNum = parseInt(quantity, 10) || 0;

  function handleDecrement() {
    onQuantityChange(String(Math.max(quantityNum - 1, 0)));
  }

  function handleIncrement() {
    onQuantityChange(String(quantityNum + 1));
  }

  return (
    <View style={[styles.row, alternate ? styles.rowAlternate : null]}>
      <View style={styles.info}>
        <ThemedText numberOfLines={1}>{name}</ThemedText>
        {subtitle ? (
          <ThemedText style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      <ProficiencyDot checked={equipped} onToggle={onToggleEquipped} />
      <View style={styles.stepper}>
        <Pressable onPress={handleDecrement} style={[styles.stepperButton, { borderColor: tintColor }]} hitSlop={4}>
          <ThemedText style={[styles.stepperButtonLabel, { color: tintColor }]}>−</ThemedText>
        </Pressable>
        <EditableStat
          value={quantity}
          onChangeText={onQuantityChange}
          keyboardType="number-pad"
          style={styles.quantityItem}
          inputStyle={styles.quantityInput}
        />
        <Pressable onPress={handleIncrement} style={[styles.stepperButton, { borderColor: tintColor }]} hitSlop={4}>
          <ThemedText style={[styles.stepperButtonLabel, { color: tintColor }]}>+</ThemedText>
        </Pressable>
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
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  quantityItem: {
    minWidth: 0,
  },
  quantityInput: {
    width: 44,
    height: 32,
    fontSize: 15,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
});
