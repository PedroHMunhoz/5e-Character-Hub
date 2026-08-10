import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { AbilityCard } from '@/components/character/ability-card';
import { SavingThrowRow } from '@/components/character/saving-throw-row';
import { SkillRow } from '@/components/character/skill-row';
import { ToolRow } from '@/components/character/tool-row';
import { ThemedText } from '@/components/themed-text';
import { ABILITIES, ABILITIES_BY_KEY, SKILLS } from '@/constants/character';
import { itemKey } from '@/data/queries/equipment-lookup';
import { getAllToolItems, type ToolItem } from '@/data/queries/tools';
import { useCharacter } from '@/hooks/use-character';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  formatAbilityTotal,
  formatSignedModifier,
  getAbilityModifierFromTotal,
  getDerivedModifier,
  getProficiencyMultiplier,
} from '@/utils/ability-modifier';
import { getCharacterLevel, getProficiencyBonus } from '@/utils/proficiency';

const SKILLS_COLUMN_ONE = SKILLS.slice(0, 9);
const SKILLS_COLUMN_TWO = SKILLS.slice(9, 18);

export function CharacterAttributes() {
  const db = useSQLiteContext();
  const { character, setAbilityScore, toggleSavingThrowProficiency, setSkillProficiency, toggleToolProficiency } =
    useCharacter();
  const dividerColor = useThemeColor({}, 'gold');
  const goldColor = useThemeColor({}, 'gold');
  const [toolItems, setToolItems] = useState<ToolItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAllToolItems(db).then((items) => {
      if (!cancelled) setToolItems(items);
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  const proficiencyBonus = getProficiencyBonus(getCharacterLevel(character.classes));

  function renderSkillColumn(skills: typeof SKILLS) {
    return skills.map((skill) => {
      const skillState = character.skills[skill.key];
      const skillModifier = getDerivedModifier(
        formatAbilityTotal(character.abilities[skill.ability]),
        getProficiencyMultiplier(skillState.proficient, skillState.expertise),
        proficiencyBonus
      );

      return (
        <SkillRow
          key={skill.key}
          label={`${skill.label} (${ABILITIES_BY_KEY[skill.ability].abbr})`}
          proficient={skillState.proficient}
          expertise={skillState.expertise}
          onChangeProficiency={(next) => setSkillProficiency(skill.key, next.proficient, next.expertise)}
          modifier={formatSignedModifier(skillModifier)}
        />
      );
    });
  }

  const knownToolItems = (toolItems ?? []).filter((item) => character.tools[itemKey(item.source, item.id)] != null);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <View style={styles.abilityGrid}>
          {ABILITIES.map((ability) => {
            const abilityScore = character.abilities[ability.key];
            const total = formatAbilityTotal(abilityScore);
            const abilityModifier = getAbilityModifierFromTotal(abilityScore);

            return (
              <AbilityCard
                key={ability.key}
                style={styles.abilityCard}
                label={ability.label}
                score={total}
                onScoreChange={(value) => {
                  // The box always shows/edits the total (base + racial
                  // bonus) - solve back for `base` so the wizard-assigned
                  // racial bonus survives the edit untouched. This is an
                  // algebraic identity (new total in, same total out), so
                  // it's safe against partial/in-progress typed values too.
                  const parsed = Number(value);
                  const nextBase = Number.isFinite(parsed) ? String(parsed - abilityScore.racialBonus) : value;
                  setAbilityScore(ability.key, nextBase);
                }}
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
            const abilityScore = character.abilities[ability.key];
            const savingThrowModifier = getDerivedModifier(
              formatAbilityTotal(abilityScore),
              getProficiencyMultiplier(character.savingThrows[ability.key].proficient, false),
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
        {toolItems === null ? (
          <ActivityIndicator color={goldColor} />
        ) : knownToolItems.length === 0 ? (
          <ThemedText style={styles.emptyToolsText}>Nenhuma proficiência em ferramentas.</ThemedText>
        ) : (
          knownToolItems.map((item) => {
            const key = itemKey(item.source, item.id);
            return (
              <ToolRow
                key={key}
                label={item.name}
                proficient={character.tools[key]?.proficient ?? false}
                onToggleProficiency={() => toggleToolProficiency(key)}
              />
            );
          })
        )}
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
  emptyToolsText: {
    fontSize: 14,
    opacity: 0.7,
  },
});
