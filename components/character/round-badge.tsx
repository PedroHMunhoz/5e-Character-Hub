import { StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface RoundBadgeProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: KeyboardTypeOptions;
}

export function RoundBadge({ label, value, onChangeText, keyboardType = 'number-pad' }: RoundBadgeProps) {
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={styles.container}>
      <View style={[styles.circle, { borderColor }]}>
        <TextInput
          style={[styles.input, { color: textColor }]}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
        />
      </View>
      <ThemedText style={styles.label}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 10,
    textTransform: 'uppercase',
    opacity: 0.7,
    textAlign: 'center',
  },
});
