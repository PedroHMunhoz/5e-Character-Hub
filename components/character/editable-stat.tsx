import { StyleSheet, TextInput, View, type KeyboardTypeOptions, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface EditableStatProps {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: KeyboardTypeOptions;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function EditableStat({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  placeholder,
  style,
  inputStyle,
}: EditableStatProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  return (
    <View style={[styles.container, style]}>
      {label ? <ThemedText style={styles.label}>{label}</ThemedText> : null}
      <TextInput
        style={[styles.input, { color: textColor, borderColor }, inputStyle]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={borderColor}
        selectTextOnFocus
      />
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
    fontSize: 18,
    width: 64,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});
