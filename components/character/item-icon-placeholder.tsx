import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ItemIconPlaceholderProps {
  badge?: string;
}

export function ItemIconPlaceholder({ badge }: ItemIconPlaceholderProps) {
  const borderColor = useThemeColor({}, 'gold');

  return (
    <View style={[styles.container, { borderColor }]}>
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
    width: 56,
    height: 56,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
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
