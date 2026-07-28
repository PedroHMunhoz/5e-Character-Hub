import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { EditableModifier } from '@/components/character/editable-modifier';
import { EditableStat } from '@/components/character/editable-stat';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface AbilityCardProps {
  label: string;
  score: string;
  onScoreChange: (value: string) => void;
  modifier: string;
  onModifierChange: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function AbilityCard({ label, score, onScoreChange, modifier, onModifierChange, style }: AbilityCardProps) {
  const borderColor = useThemeColor({}, 'icon');

  return (
    <ThemedView style={[styles.card, { borderColor }, style]}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <EditableModifier value={modifier} onChangeText={onModifierChange} style={styles.modifierInput} />
      <EditableStat value={score} onChangeText={onScoreChange} keyboardType="number-pad" inputStyle={styles.scoreInput} />
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
    height: 52,
    width: 72,
  },
  scoreInput: {
    borderRadius: 999,
    fontSize: 16,
    width: 48,
  },
});
