import { StyleSheet, View } from 'react-native';

import { EditableModifier } from '@/components/character/editable-modifier';
import { ProficiencyDot } from '@/components/character/proficiency-dot';
import { ThemedText } from '@/components/themed-text';

interface SkillRowProps {
  label: string;
  proficient: boolean;
  onToggleProficiency: () => void;
  modifier: string;
}

export function SkillRow({ label, proficient, onToggleProficiency, modifier }: SkillRowProps) {
  return (
    <View style={styles.row}>
      <ProficiencyDot checked={proficient} onToggle={onToggleProficiency} />
      <EditableModifier value={modifier} editable={false} style={styles.modifierInput} />
      <ThemedText style={styles.label}>{label}</ThemedText>
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
  modifierInput: {
    fontSize: 14,
    width: 48,
    height: 32,
    paddingVertical: 4,
  },
  label: {
    fontSize: 15,
    flexShrink: 1,
    minWidth: 0,
  },
});
