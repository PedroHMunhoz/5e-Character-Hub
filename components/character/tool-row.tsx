import { StyleSheet, View } from 'react-native';

import { CheckboxToggle } from '@/components/character/checkbox-toggle';
import { ThemedText } from '@/components/themed-text';

interface ToolRowProps {
  label: string;
  proficient: boolean;
  // Omit to render a read-only row (locked fields open a breakdown modal
  // via an outer Pressable instead).
  onToggleProficiency?: () => void;
}

export function ToolRow({ label, proficient, onToggleProficiency }: ToolRowProps) {
  return (
    <View style={styles.row}>
      <CheckboxToggle checked={proficient} onToggle={onToggleProficiency} />
      <ThemedText style={styles.label} numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 15,
    flexShrink: 1,
    flexGrow: 1,
    minWidth: 0,
  },
});
