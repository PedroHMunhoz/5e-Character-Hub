import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { EditableModifier } from '@/components/character/editable-modifier';
import { EditableStat } from '@/components/character/editable-stat';
import { ProficiencyDot } from '@/components/character/proficiency-dot';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface AbilityCardProps {
  label: string;
  score: string;
  onScoreChange: (value: string) => void;
  modifier: string;
  onModifierChange: (value: string) => void;
  savingThrowProficient: boolean;
  onToggleSavingThrowProficiency: () => void;
  savingThrowModifier: string;
  onSavingThrowModifierChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function AbilityCard({
  label,
  score,
  onScoreChange,
  modifier,
  onModifierChange,
  savingThrowProficient,
  onToggleSavingThrowProficiency,
  savingThrowModifier,
  onSavingThrowModifierChange,
  style,
}: AbilityCardProps) {
  const borderColor = useThemeColor({}, 'icon');

  return (
    <ThemedView style={[styles.card, { borderColor }, style]}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <EditableModifier value={modifier} onChangeText={onModifierChange} style={styles.modifierInput} />
      <EditableStat value={score} onChangeText={onScoreChange} keyboardType="number-pad" inputStyle={styles.scoreInput} />
      <View style={styles.savingThrowRow}>
        <ProficiencyDot checked={savingThrowProficient} onToggle={onToggleSavingThrowProficiency} />
        <EditableModifier
          value={savingThrowModifier}
          onChangeText={onSavingThrowModifierChange}
          style={styles.savingThrowInput}
        />
        <ThemedText style={styles.savingThrowLabel} numberOfLines={1}>
          Resistência
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  modifierInput: {
    fontSize: 28,
    width: 72,
  },
  scoreInput: {
    borderRadius: 999,
    fontSize: 16,
    width: 48,
  },
  savingThrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'stretch',
    minWidth: 0,
  },
  savingThrowInput: {
    fontSize: 14,
    width: 40,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  savingThrowLabel: {
    fontSize: 12,
    opacity: 0.7,
    flexShrink: 1,
  },
});
