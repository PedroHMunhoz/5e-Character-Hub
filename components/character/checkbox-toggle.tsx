import { Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeColor } from '@/hooks/use-theme-color';

interface CheckboxToggleProps {
  checked: boolean;
  onToggle: () => void;
}

export function CheckboxToggle({ checked, onToggle }: CheckboxToggleProps) {
  const goldColor = useThemeColor({}, 'gold');

  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={8}
      style={[styles.box, { borderColor: goldColor }]}>
      {checked ? <MaterialCommunityIcons name="check" size={14} color={goldColor} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
