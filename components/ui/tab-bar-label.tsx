import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface TabBarLabelProps {
  label: string;
  color: string;
}

export function TabBarLabel({ label, color }: TabBarLabelProps) {
  return (
    <ThemedText
      style={[styles.label, { color }]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.75}>
      {label}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 8,
    lineHeight: 10,
    textAlign: 'center',
    flexShrink: 1,
  },
});
