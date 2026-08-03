import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useCharacter } from "@/hooks/use-character";
import { useThemeColor } from "@/hooks/use-theme-color";
import { formatPassiveScore, getPassiveScore } from "@/utils/ability-modifier";

interface PassiveScoresProps {
  proficiencyBonus: number | null;
}

export function PassiveScores({ proficiencyBonus }: PassiveScoresProps) {
  const { character } = useCharacter();
  const goldColor = useThemeColor({}, "gold");

  const passiveArcana = getPassiveScore(
    character.abilities.int.score,
    character.skills.arcanismo.proficient,
    proficiencyBonus,
  );
  const passivePerception = getPassiveScore(
    character.abilities.wis.score,
    character.skills.percepcao.proficient,
    proficiencyBonus,
  );
  const passiveInsight = getPassiveScore(
    character.abilities.wis.score,
    character.skills.intuicao.proficient,
    proficiencyBonus,
  );
  const passiveInvestigation = getPassiveScore(
    character.abilities.int.score,
    character.skills.investigacao.proficient,
    proficiencyBonus,
  );

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Perícias Passivas
      </ThemedText>
      <View style={styles.grid}>
        <View style={styles.column}>
          <View style={styles.passiveRow}>
            <ThemedText style={styles.passiveLabel} numberOfLines={1}>
              Arcanismo Passivo
            </ThemedText>
            <ThemedText style={[styles.passiveValue, { color: goldColor }]}>
              {formatPassiveScore(passiveArcana)}
            </ThemedText>
          </View>
          <View style={styles.passiveRow}>
            <ThemedText style={styles.passiveLabel} numberOfLines={1}>
              Percepção Passiva
            </ThemedText>
            <ThemedText style={[styles.passiveValue, { color: goldColor }]}>
              {formatPassiveScore(passivePerception)}
            </ThemedText>
          </View>
        </View>
        <View style={styles.column}>
          <View style={styles.passiveRow}>
            <ThemedText style={styles.passiveLabel} numberOfLines={1}>
              Intuição Passiva
            </ThemedText>
            <ThemedText style={[styles.passiveValue, { color: goldColor }]}>
              {formatPassiveScore(passiveInsight)}
            </ThemedText>
          </View>
          <View style={styles.passiveRow}>
            <ThemedText style={styles.passiveLabel} numberOfLines={1}>
              Investigação Passiva
            </ThemedText>
            <ThemedText style={[styles.passiveValue, { color: goldColor }]}>
              {formatPassiveScore(passiveInvestigation)}
            </ThemedText>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  title: { fontSize: 16 },
  grid: { flexDirection: "row", gap: 16 },
  column: { flex: 1, minWidth: 0, gap: 10 },
  passiveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  passiveLabel: { fontSize: 15, flexShrink: 1, minWidth: 0 },
  passiveValue: {
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
