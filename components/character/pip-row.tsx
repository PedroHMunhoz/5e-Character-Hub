import { type ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeColor } from '@/hooks/use-theme-color';

interface PipRowProps {
  count: number;
  filled: number;
  onSetFilled: (value: number) => void;
  color?: string;
  icon?: ComponentProps<typeof MaterialCommunityIcons>['name'];
}

export function PipRow({ count, filled, onSetFilled, color, icon }: PipRowProps) {
  const borderColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');
  const fillColor = color ?? tintColor;

  function handlePress(index: number) {
    const nextValue = index + 1;
    onSetFilled(nextValue === filled ? index : nextValue);
  }

  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, index) => {
        const isFilled = index < filled;
        return (
          <Pressable
            key={index}
            onPress={() => handlePress(index)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isFilled }}
            hitSlop={6}
            style={[styles.pip, { borderColor: isFilled ? fillColor : borderColor }]}
          >
            {isFilled ? (
              icon ? (
                <MaterialCommunityIcons name={icon} size={14} color={fillColor} />
              ) : (
                <View style={[styles.dot, { backgroundColor: fillColor }]} />
              )
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  pip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
});
