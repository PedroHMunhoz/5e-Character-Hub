import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { EditableStat } from '@/components/character/editable-stat';
import { HexModifierBadge } from '@/components/character/hex-modifier-badge';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface AbilityCardProps {
  label: string;
  score: string;
  onScoreChange: (value: string) => void;
  modifier: string;
  style?: StyleProp<ViewStyle>;
}

export function AbilityCard({ label, score, onScoreChange, modifier, style }: AbilityCardProps) {
  const borderColor = useThemeColor({}, 'gold');

  return (
    <ThemedView style={[styles.card, { borderColor }, style]}>
      <HexModifierBadge value={modifier} style={styles.modifierBadge} />
      <EditableStat
        value={score}
        onChangeText={onScoreChange}
        keyboardType="number-pad"
        inputStyle={styles.scoreInput}
      />
      <ThemedText style={styles.label} numberOfLines={1}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    paddingTop: 16,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
    overflow: 'visible',
  },
  modifierBadge: {
    position: 'absolute',
    top: -16,
    right: -10,
  },
  scoreInput: {
    borderWidth: 0,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '700',
    height: 44,
    width: 64,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
