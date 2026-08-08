import { Pressable, StyleSheet, View } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

interface ProficiencyDotProps {
  checked: boolean;
  onToggle: () => void;
}

export function ProficiencyDot({ checked, onToggle }: ProficiencyDotProps) {
  const borderColor = useThemeColor({}, 'icon');
  const fillColor = useThemeColor({}, 'tint');

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={8}
      style={[styles.dot, { borderColor }]}
    >
      {checked ? <View style={[styles.fill, { backgroundColor: fillColor }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
