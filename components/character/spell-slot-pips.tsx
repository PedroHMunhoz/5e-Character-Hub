import { Pressable, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeColor } from '@/hooks/use-theme-color';

interface SpellSlotPipsProps {
  max: number;
  used: number;
  onChange: (value: number) => void;
}

export function SpellSlotPips({ max, used, onChange }: SpellSlotPipsProps) {
  const goldColor = useThemeColor({}, 'gold');

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
            style={[styles.box, { borderColor: goldColor }]}
          >
            {isAvailable ? <MaterialCommunityIcons name="check" size={14} color={goldColor} /> : null}
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
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
