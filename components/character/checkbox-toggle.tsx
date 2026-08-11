import { Pressable, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeColor } from '@/hooks/use-theme-color';

interface CheckboxToggleProps {
  checked: boolean;
  // Omit to render a static (non-interactive) checkbox - used for locked
  // fields that open a breakdown modal via an outer Pressable instead.
  onToggle?: () => void;
  // Dims the checkbox without dropping interactivity - e.g. a prepared-
  // spell checkbox at the class's prepared cap still needs to intercept the
  // tap (to warn instead of silently toggling, and to stop it bubbling into
  // the row's "open spell detail" press) without looking editable.
  dimmed?: boolean;
}

export function CheckboxToggle({ checked, onToggle, dimmed }: CheckboxToggleProps) {
  const goldColor = useThemeColor({}, 'gold');

  if (!onToggle) {
    return (
      <View
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        style={[styles.box, styles.boxDisabled, { borderColor: goldColor }]}
      >
        {checked ? <MaterialCommunityIcons name="check" size={14} color={goldColor} /> : null}
      </View>
    );
  }

  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={8}
      style={[styles.box, dimmed && styles.boxDisabled, { borderColor: goldColor }]}
    >
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
  boxDisabled: {
    opacity: 0.5,
  },
});
