import { StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface BiographyTextareaProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  minHeight?: number;
  style?: StyleProp<ViewStyle>;
}

export function BiographyTextarea({
  label,
  value,
  onChangeText,
  minHeight = 100,
  style,
}: BiographyTextareaProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  return (
    <View style={[styles.container, { borderColor }, style]}>
      <ThemedText style={[styles.label, { color: borderColor }]} numberOfLines={1}>
        {label}
      </ThemedText>
      <TextInput
        style={[styles.input, { color: textColor, minHeight }]}
        value={value}
        onChangeText={onChangeText}
        multiline
        textAlignVertical="top"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    paddingTop: 23,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  label: {
    position: 'absolute',
    top: 6,
    left: 8,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  input: {
    fontSize: 14,
    padding: 0,
  },
});
