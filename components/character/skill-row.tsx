import { StyleSheet, View } from 'react-native';

import { EditableModifier } from '@/components/character/editable-modifier';
import { ProficiencyDot } from '@/components/character/proficiency-dot';
import { ThemedText } from '@/components/themed-text';

interface SkillRowProps {
  label: string;
  proficient: boolean;
  onToggleProficiency: () => void;
  modifier: string;
  onModifierChange: (value: string) => void;
}

export function SkillRow({ label, proficient, onToggleProficiency, modifier, onModifierChange }: SkillRowProps) {
  return (
    <View style={styles.row}>
      <ProficiencyDot checked={proficient} onToggle={onToggleProficiency} />
      <EditableModifier value={modifier} onChangeText={onModifierChange} style={styles.modifierInput} />
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
    paddingVertical: 4,
  },
  label: {
    fontSize: 15,
    flexShrink: 1,
    minWidth: 0,
  },
});
