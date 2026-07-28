import { ScrollView, StyleSheet, View } from 'react-native';

import { AbilityCard } from '@/components/character/ability-card';
import { EditableStat } from '@/components/character/editable-stat';
import { SkillRow } from '@/components/character/skill-row';
import { ThemedText } from '@/components/themed-text';
import { ABILITIES, ABILITIES_BY_KEY, SKILLS } from '@/constants/character';
import { useCharacter } from '@/hooks/use-character';

export function CharacterAttributes() {
  const {
    character,
    setAbilityScore,
    setAbilityModifier,
    toggleSavingThrowProficiency,
    setSavingThrowModifier,
    toggleSkillProficiency,
    setSkillModifier,
    setPassivePerception,
    setPassiveInsight,
  } = useCharacter();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <ThemedText type="subtitle">Atributos</ThemedText>
        <View style={styles.abilityGrid}>
          {ABILITIES.map((ability) => (
            <AbilityCard
              key={ability.key}
              style={styles.abilityCard}
              label={ability.label}
              score={character.abilities[ability.key].score}
              onScoreChange={(value) => setAbilityScore(ability.key, value)}
              modifier={character.abilities[ability.key].modifier}
              onModifierChange={(value) => setAbilityModifier(ability.key, value)}
              savingThrowProficient={character.savingThrows[ability.key].proficient}
              onToggleSavingThrowProficiency={() => toggleSavingThrowProficiency(ability.key)}
              savingThrowModifier={character.savingThrows[ability.key].modifier}
              onSavingThrowModifierChange={(value) => setSavingThrowModifier(ability.key, value)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.passiveRow}>
          <ThemedText style={styles.passiveLabel}>Percepção Passiva</ThemedText>
          <EditableStat value={character.passivePerception} onChangeText={setPassivePerception} keyboardType="number-pad" />
        </View>
        <View style={styles.passiveRow}>
          <ThemedText style={styles.passiveLabel}>Intuição Passiva</ThemedText>
          <EditableStat value={character.passiveInsight} onChangeText={setPassiveInsight} keyboardType="number-pad" />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Perícias</ThemedText>
        <View style={styles.skillsList}>
          {SKILLS.map((skill) => (
            <SkillRow
              key={skill.key}
              label={`${skill.label} (${ABILITIES_BY_KEY[skill.ability].abbr})`}
              proficient={character.skills[skill.key].proficient}
              onToggleProficiency={() => toggleSkillProficiency(skill.key)}
              modifier={character.skills[skill.key].modifier}
              onModifierChange={(value) => setSkillModifier(skill.key, value)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Ferramentas</ThemedText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  abilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  abilityCard: {
    width: '30%',
    minWidth: 0,
  },
  skillsList: {
    alignSelf: 'center',
  },
  passiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  passiveLabel: {
    fontSize: 15,
    flexShrink: 1,
    minWidth: 0,
  },
});
