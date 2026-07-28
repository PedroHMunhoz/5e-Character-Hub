import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface LevelBadgeProps {
  level: number;
}

export function LevelBadge({ level }: LevelBadgeProps) {
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View style={[styles.circle, { borderColor: tintColor }]}>
      <ThemedText style={[styles.value, { color: tintColor }]}>{level}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
  },
});
