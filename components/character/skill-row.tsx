import { StyleSheet, View } from 'react-native';

import { SkillProficiencyToggle } from '@/components/character/skill-proficiency-toggle';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface SkillRowProps {
  label: string;
  proficient: boolean;
  expertise: boolean;
  onChangeProficiency: (next: { proficient: boolean; expertise: boolean }) => void;
  modifier: string;
}

export function SkillRow({ label, proficient, expertise, onChangeProficiency, modifier }: SkillRowProps) {
  const goldColor = useThemeColor({}, 'gold');

  return (
    <View style={styles.row}>
      <SkillProficiencyToggle
        proficient={proficient}
        expertise={expertise}
        expertiseAllowed
        onChange={onChangeProficiency}
      />
      <ThemedText style={styles.label} numberOfLines={1}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.value, { color: goldColor }]}>{modifier}</ThemedText>
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
  value: {
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
