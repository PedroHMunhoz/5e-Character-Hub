import { StyleSheet, View } from 'react-native';

import { EditableStat } from '@/components/character/editable-stat';
import { ThemedText } from '@/components/themed-text';
import { useCharacter } from '@/hooks/use-character';
import { formatPassiveScore, getPassiveScore } from '@/utils/ability-modifier';

interface PassiveScoresProps {
  proficiencyBonus: number | null;
}

export function PassiveScores({ proficiencyBonus }: PassiveScoresProps) {
  const { character } = useCharacter();

  const passivePerception = getPassiveScore(
    character.abilities.wis.score,
    character.skills.percepcao.proficient,
    proficiencyBonus
  );
  const passiveInsight = getPassiveScore(
    character.abilities.wis.score,
    character.skills.intuicao.proficient,
    proficiencyBonus
  );
  const passiveInvestigation = getPassiveScore(
    character.abilities.int.score,
    character.skills.investigacao.proficient,
    proficiencyBonus
  );

  return (
    <View style={styles.section}>
      <View style={styles.passiveRow}>
        <ThemedText style={styles.passiveLabel}>Percepção Passiva</ThemedText>
        <EditableStat value={formatPassiveScore(passivePerception)} editable={false} keyboardType="number-pad" />
      </View>
      <View style={styles.passiveRow}>
        <ThemedText style={styles.passiveLabel}>Intuição Passiva</ThemedText>
        <EditableStat value={formatPassiveScore(passiveInsight)} editable={false} keyboardType="number-pad" />
      </View>
      <View style={styles.passiveRow}>
        <ThemedText style={styles.passiveLabel}>Investigação Passiva</ThemedText>
        <EditableStat value={formatPassiveScore(passiveInvestigation)} editable={false} keyboardType="number-pad" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  passiveRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  passiveLabel: { fontSize: 15, flexShrink: 1, minWidth: 0 },
});
