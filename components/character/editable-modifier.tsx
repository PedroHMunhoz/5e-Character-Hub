import { StyleSheet, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatModifier } from '@/utils/format-modifier';

interface EditableModifierProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
}

export function EditableModifier({ label, value, onChangeText, style, containerStyle }: EditableModifierProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  const input = (
    <TextInput
      style={[styles.input, { color: textColor, borderColor }, style]}
      value={value}
      onChangeText={onChangeText}
      onBlur={() => onChangeText(formatModifier(value))}
      keyboardType="default"
    />
  );

  if (!label) {
    return input;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {input}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  label: {
    fontSize: 12,
    textTransform: 'uppercase',
    opacity: 0.7,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 20,
    fontWeight: '600',
    height: 40,
    width: 64,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
