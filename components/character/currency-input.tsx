import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface CurrencyInputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}

export function CurrencyInput({ label, value, onChangeText }: CurrencyInputProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'gold');

  function handleChangeText(text: string) {
    onChangeText(text.replace(/[^0-9]/g, ''));
  }

  return (
    <View style={[styles.container, { borderColor }]}>
      <ThemedText style={[styles.label, { color: borderColor }]} numberOfLines={1}>
        {label}
      </ThemedText>
      <TextInput
        style={[styles.input, { color: textColor }]}
        value={value}
        onChangeText={handleChangeText}
        keyboardType="number-pad"
        textAlign="center"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 8,
    paddingTop: 14,
    paddingBottom: 6,
    paddingHorizontal: 4,
  },
  label: {
    position: 'absolute',
    top: 2,
    left: 4,
    fontSize: 10,
    fontWeight: '600',
  },
  input: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
    padding: 0,
  },
});
