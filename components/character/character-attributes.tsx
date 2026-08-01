import { ScrollView, StyleSheet, View } from 'react-native';

import { AbilityCard } from '@/components/character/ability-card';
import { EditableStat } from '@/components/character/editable-stat';
import { SkillRow } from '@/components/character/skill-row';
import { ThemedText } from '@/components/themed-text';
import { ABILITIES, ABILITIES_BY_KEY, SKILLS } from '@/constants/character';
import { useCharacter } from '@/hooks/use-character';
import {
  formatPassiveScore,
  formatSignedModifier,
  getAbilityModifier,
  getDerivedModifier,
  getPassiveScore,
} from '@/utils/ability-modifier';

export function CharacterAttributes() {
  const { character, setAbilityScore, toggleSavingThrowProficiency, toggleSkillProficiency } = useCharacter();

  const passivePerception = getPassiveScore(
    character.abilities.wis.score,
    character.skills.percepcao.proficient,
    character.proficiencyBonus
  );
  const passiveInsight = getPassiveScore(
    character.abilities.wis.score,
    character.skills.intuicao.proficient,
    character.proficiencyBonus
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <ThemedText type="subtitle">Atributos</ThemedText>
        <View style={styles.abilityGrid}>
          {ABILITIES.map((ability) => {
            const score = character.abilities[ability.key].score;
            const abilityModifier = getAbilityModifier(score);
            const savingThrowModifier = getDerivedModifier(
              score,
              character.savingThrows[ability.key].proficient,
              character.proficiencyBonus
            );

            return (
              <AbilityCard
                key={ability.key}
                style={styles.abilityCard}
                label={ability.label}
                score={score}
                onScoreChange={(value) => setAbilityScore(ability.key, value)}
                modifier={formatSignedModifier(abilityModifier)}
                savingThrowProficient={character.savingThrows[ability.key].proficient}
                onToggleSavingThrowProficiency={() => toggleSavingThrowProficiency(ability.key)}
                savingThrowModifier={formatSignedModifier(savingThrowModifier)}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.passiveRow}>
          <ThemedText style={styles.passiveLabel}>Percepção Passiva</ThemedText>
          <EditableStat value={formatPassiveScore(passivePerception)} editable={false} keyboardType="number-pad" />
        </View>
        <View style={styles.passiveRow}>
          <ThemedText style={styles.passiveLabel}>Intuição Passiva</ThemedText>
          <EditableStat value={formatPassiveScore(passiveInsight)} editable={false} keyboardType="number-pad" />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Perícias</ThemedText>
        <View style={styles.skillsList}>
          {SKILLS.map((skill) => {
            const skillModifier = getDerivedModifier(
              character.abilities[skill.ability].score,
              character.skills[skill.key].proficient,
              character.proficiencyBonus
            );

            return (
              <SkillRow
                key={skill.key}
                label={`${skill.label} (${ABILITIES_BY_KEY[skill.ability].abbr})`}
                proficient={character.skills[skill.key].proficient}
                onToggleProficiency={() => toggleSkillProficiency(skill.key)}
                modifier={formatSignedModifier(skillModifier)}
              />
            );
          })}
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
