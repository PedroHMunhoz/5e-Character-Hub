import { StyleSheet, View } from 'react-native';

import { ProficiencyDot } from '@/components/character/proficiency-dot';
import { ThemedText } from '@/components/themed-text';

interface InspirationToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function InspirationToggle({ value, onValueChange }: InspirationToggleProps) {
  return (
    <View style={styles.row}>
      <ThemedText style={styles.label}>Inspiração</ThemedText>
      <ProficiencyDot checked={value} onToggle={() => onValueChange(!value)} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
  },
});
