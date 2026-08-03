import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface BiographyTextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}

export function BiographyTextField({ label, value, onChangeText }: BiographyTextFieldProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'gold');

  return (
    <View style={[styles.container, { borderColor }]}>
      <ThemedText style={[styles.label, { color: borderColor }]} numberOfLines={1}>
        {label}
      </ThemedText>
      <TextInput
        style={[styles.input, { color: textColor }]}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    flexBasis: '48%',
    minWidth: 140,
    borderWidth: 1,
    borderRadius: 8,
    paddingTop: 19,
    paddingBottom: 10,
    paddingHorizontal: 8,
  },
  label: {
    position: 'absolute',
    top: 2,
    left: 4,
    fontSize: 10,
    fontWeight: '600',
  },
  input: {
    fontSize: 16,
    padding: 0,
  },
});
