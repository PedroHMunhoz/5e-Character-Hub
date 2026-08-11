import { Pressable, StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useThemeColor } from '@/hooks/use-theme-color';

interface SkillProficiencyToggleProps {
  proficient: boolean;
  expertise: boolean;
  // Only classes with a level-1 "Expertise" feature (e.g. Rogue) expose the
  // third cycle state - see the wizard's skill-choice step, which is what
  // actually grants expertise=true in the first place.
  expertiseAllowed: boolean;
  // Omit to render a static (non-interactive) indicator - used for locked
  // fields that open a breakdown modal via an outer Pressable instead.
  onChange?: (next: { proficient: boolean; expertise: boolean }) => void;
}

// Cycles nenhuma -> proficiente -> (especialização, só se expertiseAllowed) -> nenhuma.
export function SkillProficiencyToggle({
  proficient,
  expertise,
  expertiseAllowed,
  onChange,
}: SkillProficiencyToggleProps) {
  const goldColor = useThemeColor({}, 'gold');

  const icon = expertise ? (
    <MaterialCommunityIcons name="check-all" size={14} color={goldColor} />
  ) : proficient ? (
    <MaterialCommunityIcons name="check" size={14} color={goldColor} />
  ) : null;

  if (!onChange) {
    return (
      <View
        accessibilityRole="checkbox"
        accessibilityState={{ checked: proficient }}
        style={[styles.box, styles.boxDisabled, { borderColor: goldColor }]}
      >
        {icon}
      </View>
    );
  }

  function handlePress() {
    if (!proficient) {
      onChange!({ proficient: true, expertise: false });
    } else if (!expertise && expertiseAllowed) {
      onChange!({ proficient: true, expertise: true });
    } else {
      onChange!({ proficient: false, expertise: false });
    }
  }

  return (
    <Pressable
      onPress={(event) => {
        event.stopPropagation();
        handlePress();
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: proficient }}
      hitSlop={8}
      style={[styles.box, { borderColor: goldColor }]}
    >
      {icon}
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
