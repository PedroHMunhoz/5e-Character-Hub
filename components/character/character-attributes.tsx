import { ScrollView, StyleSheet, View } from 'react-native';

import { AbilityCard } from '@/components/character/ability-card';
import { SavingThrowRow } from '@/components/character/saving-throw-row';
import { SkillRow } from '@/components/character/skill-row';
import { ThemedText } from '@/components/themed-text';
import { ABILITIES, ABILITIES_BY_KEY, SKILLS } from '@/constants/character';
import { useCharacter } from '@/hooks/use-character';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatSignedModifier, getAbilityModifier, getDerivedModifier } from '@/utils/ability-modifier';
import { getCharacterLevel, getProficiencyBonus } from '@/utils/proficiency';

const SKILLS_COLUMN_ONE = SKILLS.slice(0, 9);
const SKILLS_COLUMN_TWO = SKILLS.slice(9, 18);

export function CharacterAttributes() {
  const { character, setAbilityScore, toggleSavingThrowProficiency, toggleSkillProficiency } = useCharacter();
  const dividerColor = useThemeColor({}, 'gold');

  const proficiencyBonus = getProficiencyBonus(getCharacterLevel(character.classes));

  function renderSkillColumn(skills: typeof SKILLS) {
    return skills.map((skill) => {
      const skillModifier = getDerivedModifier(
        character.abilities[skill.ability].score,
        character.skills[skill.key].proficient,
        proficiencyBonus
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
    });
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <View style={styles.abilityGrid}>
          {ABILITIES.map((ability) => {
            const score = character.abilities[ability.key].score;
            const abilityModifier = getAbilityModifier(score);

            return (
              <AbilityCard
                key={ability.key}
                style={styles.abilityCard}
                label={ability.label}
                score={score}
                onScoreChange={(value) => setAbilityScore(ability.key, value)}
                modifier={formatSignedModifier(abilityModifier)}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Salvaguardas</ThemedText>
        <View style={[styles.divider, { borderColor: dividerColor }]} />
        <View style={styles.savingThrowGrid}>
          {ABILITIES.map((ability) => {
            const score = character.abilities[ability.key].score;
            const savingThrowModifier = getDerivedModifier(
              score,
              character.savingThrows[ability.key].proficient,
              proficiencyBonus
            );

            return (
              <SavingThrowRow
                key={ability.key}
                style={styles.savingThrowRow}
                label={ability.label}
                proficient={character.savingThrows[ability.key].proficient}
                onToggleProficiency={() => toggleSavingThrowProficiency(ability.key)}
                modifier={formatSignedModifier(savingThrowModifier)}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Perícias</ThemedText>
        <View style={styles.skillsGrid}>
          <View style={styles.skillsColumn}>{renderSkillColumn(SKILLS_COLUMN_ONE)}</View>
          <View style={styles.skillsColumn}>{renderSkillColumn(SKILLS_COLUMN_TWO)}</View>
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
    rowGap: 20,
  },
  abilityCard: {
    width: '30%',
    minWidth: 0,
  },
  divider: {
    borderBottomWidth: 1,
  },
  savingThrowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  savingThrowRow: {
    width: '48%',
    minWidth: 0,
  },
  skillsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  skillsColumn: {
    flex: 1,
    minWidth: 0,
  },
});
