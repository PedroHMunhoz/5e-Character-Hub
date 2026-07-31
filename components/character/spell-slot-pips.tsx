import { Pressable, StyleSheet, View } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

interface SpellSlotPipsProps {
  max: number;
  used: number;
  onChange: (value: number) => void;
}

export function SpellSlotPips({ max, used, onChange }: SpellSlotPipsProps) {
  const borderColor = useThemeColor({}, 'icon');
  const fillColor = useThemeColor({}, 'text');

  const available = Math.max(max - used, 0);

  function handlePress(index: number) {
    const nextAvailable = index + 1;
    const newAvailable = nextAvailable === available ? index : nextAvailable;
    onChange(max - newAvailable);
  }

  if (max <= 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      {Array.from({ length: max }).map((_, index) => {
        const isAvailable = index < available;
        return (
          <Pressable
            key={index}
            onPress={() => handlePress(index)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isAvailable }}
            hitSlop={6}
            style={[styles.pip, { borderColor }]}>
            {isAvailable ? <View style={[styles.dot, { backgroundColor: fillColor }]} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  pip: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
