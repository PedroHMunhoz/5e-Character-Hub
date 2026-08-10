import { Pressable, StyleSheet, View } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

interface RadioToggleProps {
  selected: boolean;
  onSelect: () => void;
}

export function RadioToggle({ selected, onSelect }: RadioToggleProps) {
  const goldColor = useThemeColor({}, 'gold');

  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation();
        onSelect();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      hitSlop={8}
      style={[styles.circle, { borderColor: goldColor }]}
    >
      {selected ? <View style={[styles.dot, { backgroundColor: goldColor }]} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
