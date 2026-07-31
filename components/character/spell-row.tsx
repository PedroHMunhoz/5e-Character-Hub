import { Pressable, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface SpellRowProps {
  name: string;
  subtitle?: string;
  ritual?: boolean;
  prepared: boolean;
  onTogglePrepared: () => void;
  alternate?: boolean;
}

export function SpellRow({ name, subtitle, ritual = false, prepared, onTogglePrepared, alternate = false }: SpellRowProps) {
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  return (
    <View style={[styles.row, alternate ? styles.rowAlternate : null]}>
      <View style={styles.info}>
        <ThemedText numberOfLines={1}>{name}</ThemedText>
        {subtitle ? (
          <ThemedText style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {ritual ? <MaterialCommunityIcons name="candle" size={18} color={iconColor} /> : null}
      <Pressable
        onPress={onTogglePrepared}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: prepared }}
        hitSlop={8}>
        <MaterialCommunityIcons
          name={prepared ? 'cog' : 'cog-outline'}
          size={22}
          color={prepared ? tintColor : iconColor}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  rowAlternate: {
    backgroundColor: 'rgba(127,127,127,0.08)',
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
});
