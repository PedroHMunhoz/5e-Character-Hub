import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ItemIconPlaceholderProps {
  badge?: string;
  size?: number;
  fill?: boolean;
}

export function ItemIconPlaceholder({ badge, size = 56, fill }: ItemIconPlaceholderProps) {
  const borderColor = useThemeColor({}, 'gold');

  return (
    <View style={[styles.container, { borderColor }, fill ? styles.fill : { width: size, height: size }]}>
      {badge ? (
        <View style={[styles.badge, { borderColor }]}>
          <ThemedText style={[styles.badgeText, { color: borderColor }]}>{badge}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
  },
  badge: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    minWidth: 18,
    paddingHorizontal: 3,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
});
