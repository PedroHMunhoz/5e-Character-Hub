import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { AbilityMethod } from '@/context/wizard-context';

const METHOD_OPTIONS: { value: AbilityMethod; label: string }[] = [
  { value: 'roll', label: 'Rolagem 4d6' },
  { value: 'array', label: 'Array Fixo' },
  { value: 'pointBuy', label: 'Compra de Pontos' },
];

interface AbilityMethodToggleProps {
  value: AbilityMethod | null;
  onChange: (method: AbilityMethod) => void;
}

export function AbilityMethodToggle({ value, onChange }: AbilityMethodToggleProps) {
  const goldColor = useThemeColor({}, 'gold');

  return (
    <View style={styles.container}>
      {METHOD_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.pill,
              { borderColor: goldColor },
              selected ? { backgroundColor: goldColor } : undefined,
            ]}
          >
            <ThemedText style={[styles.label, selected ? styles.labelSelected : { color: goldColor }]}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  labelSelected: {
    color: '#000',
  },
});
