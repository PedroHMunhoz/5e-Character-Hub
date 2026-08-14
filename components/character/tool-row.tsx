import { StyleSheet, View } from 'react-native';

import { SkillProficiencyToggle } from '@/components/character/skill-proficiency-toggle';
import { ThemedText } from '@/components/themed-text';

interface ToolRowProps {
  label: string;
  proficient: boolean;
  expertise: boolean;
  // Omit to render a read-only row (locked fields open a breakdown modal
  // via an outer Pressable instead).
  onToggleProficiency?: () => void;
}

export function ToolRow({ label, proficient, expertise, onToggleProficiency }: ToolRowProps) {
  return (
    <View style={styles.row}>
      <SkillProficiencyToggle
        proficient={proficient}
        expertise={expertise}
        expertiseAllowed
        onChange={onToggleProficiency ? () => onToggleProficiency() : undefined}
      />
      <ThemedText style={styles.label} numberOfLines={1}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 15,
    flexShrink: 1,
    flexGrow: 1,
    minWidth: 0,
  },
});
