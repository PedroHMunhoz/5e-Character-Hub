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
      <View style={styles.trSection}>
        <ThemedText style={styles.trTitle} numberOfLines={1}>
          Salvaguarda
        </ThemedText>
        <View style={styles.trRow}>
          <ProficiencyDot checked={savingThrowProficient} onToggle={onToggleSavingThrowProficiency} />
          <EditableModifier value={savingThrowModifier} onChangeText={onSavingThrowModifierChange} style={styles.trModifierInput} />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  modifierInput: {
    fontSize: 20,
    height: 40,
    width: 56,
  },
  scoreInput: {
    borderRadius: 999,
    fontSize: 14,
    width: 36,
  },
  trSection: {
    alignItems: 'center',
    gap: 2,
  },
  trTitle: {
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.75,
    textTransform: 'uppercase',
  },
  trRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trModifierInput: {
    fontSize: 14,
    height: 28,
    width: 44,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
});
