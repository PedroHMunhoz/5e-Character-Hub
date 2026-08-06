import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface PropertyPillProps {
  label: string;
  onPress: () => void;
}

export function PropertyPill({ label, onPress }: PropertyPillProps) {
  const goldColor = useThemeColor({}, 'gold');

  return (
    <Pressable onPress={onPress} style={[styles.pill, { borderColor: goldColor }]}>
      <ThemedText style={[styles.label, { color: goldColor }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
