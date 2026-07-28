import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface InspirationToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function InspirationToggle({ value, onValueChange }: InspirationToggleProps) {
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View style={styles.row}>
      <ThemedText style={styles.label}>Inspiração</ThemedText>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: tintColor }} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
  },
});
