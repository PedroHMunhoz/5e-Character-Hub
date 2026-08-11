import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { CheckboxToggle } from '@/components/character/checkbox-toggle';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface SavingThrowRowProps {
  label: string;
  proficient: boolean;
  // Omit to render a read-only row (locked fields open a breakdown modal
  // via an outer Pressable instead).
  onToggleProficiency?: () => void;
  modifier: string;
  style?: StyleProp<ViewStyle>;
}

export function SavingThrowRow({ label, proficient, onToggleProficiency, modifier, style }: SavingThrowRowProps) {
  const borderColor = useThemeColor({}, 'gold');
  const goldColor = useThemeColor({}, 'gold');

  return (
    <ThemedView style={[styles.row, { borderColor }, style]}>
      <CheckboxToggle checked={proficient} onToggle={onToggleProficiency} />
      <ThemedText style={styles.label} numberOfLines={1}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.value, { color: goldColor }]}>{modifier}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  label: { fontSize: 15, flexShrink: 1, flexGrow: 1, minWidth: 0 },
  value: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
