import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

// Generic -/value/+ control, extracted from the identical inline pattern in
// components/wizard/point-buy-allocator.tsx (same 32x32 bordered buttons).
interface QuantityStepperProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function QuantityStepper({ value, min = 0, max = Infinity, onChange }: QuantityStepperProps) {
  const goldColor = useThemeColor({}, 'gold');
  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(value - 1)}
        disabled={!canDecrement}
        style={[styles.stepButton, { borderColor: goldColor, opacity: canDecrement ? 1 : 0.3 }]}
      >
        <ThemedText style={[styles.stepButtonText, { color: goldColor }]}>-</ThemedText>
      </Pressable>
      <ThemedText style={styles.value}>{value}</ThemedText>
      <Pressable
        onPress={() => onChange(value + 1)}
        disabled={!canIncrement}
        style={[styles.stepButton, { borderColor: goldColor, opacity: canIncrement ? 1 : 0.3 }]}
      >
        <ThemedText style={[styles.stepButtonText, { color: goldColor }]}>+</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepButton: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    width: 22,
    textAlign: 'center',
  },
});
