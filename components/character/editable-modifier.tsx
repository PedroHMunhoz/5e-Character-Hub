import { StyleSheet, TextInput, type StyleProp, type TextStyle } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

interface EditableModifierProps {
  value: string;
  onChangeText: (value: string) => void;
  style?: StyleProp<TextStyle>;
}

function formatModifier(value: string): string {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.startsWith('+') || trimmed.startsWith('-')) {
    return trimmed;
  }
  return /^\d+$/.test(trimmed) ? `+${trimmed}` : trimmed;
}

export function EditableModifier({ value, onChangeText, style }: EditableModifierProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  return (
    <TextInput
      style={[styles.input, { color: textColor, borderColor }, style]}
      value={value}
      onChangeText={onChangeText}
      onBlur={() => onChangeText(formatModifier(value))}
      keyboardType="default"
      selectTextOnFocus
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 20,
    fontWeight: '600',
    width: 64,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
