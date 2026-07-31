import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface TabBarLabelProps {
  label: string;
  color: string;
}

export function TabBarLabel({ label, color }: TabBarLabelProps) {
  return (
    <ThemedText style={[styles.label, { color }]}>
      {label}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 9,
    lineHeight: 11,
    textAlign: 'center',
    flexShrink: 1,
  },
});
