import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { AbilityCard } from '@/components/character/ability-card';
import { SavingThrowRow } from '@/components/character/saving-throw-row';
import { SkillRow } from '@/components/character/skill-row';
import { StatBreakdownModal, type StatBreakdownRow } from '@/components/character/stat-breakdown-modal';
import { ToolRow } from '@/components/character/tool-row';
import { ThemedText } from '@/components/themed-text';
import { ABILITIES, ABILITIES_BY_KEY, SKILLS } from '@/constants/character';
import { itemKey } from '@/data/queries/equipment-lookup';
import { getAllToolItems, type ToolItem } from '@/data/queries/tools';
import { useCharacter } from '@/hooks/use-character';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { AbilityKey, SkillKey } from '@/types/character';
import {
  formatAbilityTotal,
  formatSignedModifier,
  getAbilityModifierFromTotal,
  getAbilityTotal,
  getDerivedModifier,
  getProficiencyMultiplier,
} from '@/utils/ability-modifier';
import { getCharacterLevel, getProficiencyBonus } from '@/utils/proficiency';

const SKILLS_COLUMN_ONE = SKILLS.slice(0, 9);
const SKILLS_COLUMN_TWO = SKILLS.slice(9, 18);

type OpenField =
  | { type: 'ability'; key: AbilityKey }
  | { type: 'saving'; key: AbilityKey }
  | { type: 'skill'; key: SkillKey }
  | { type: 'tool'; key: string; label: string }
  | null;

interface Breakdown {
  title: string;
  rows: StatBreakdownRow[];
  totalLabel: string;
  totalValue: string;
}

export function CharacterAttributes() {
  const db = useSQLiteContext();
  const { character } = useCharacter();
  const dividerColor = useThemeColor({}, 'gold');
  const goldColor = useThemeColor({}, 'gold');
  const [toolItems, setToolItems] = useState<ToolItem[] | null>(null);
  const [openField, setOpenField] = useState<OpenField>(null);

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

  function getBreakdown(field: OpenField): Breakdown | null {
    if (!field) return null;

    if (field.type === 'ability') {
      const abilityScore = character.abilities[field.key];
      const total = getAbilityTotal(abilityScore);
      return {
        title: ABILITIES_BY_KEY[field.key].label,
        rows: [
          { label: 'Base', value: abilityScore.base },
          { label: 'Bônus Racial', value: formatSignedModifier(abilityScore.racialBonus) },
        ],
        totalLabel: 'Pontuação Total',
        totalValue: String(total ?? '—'),
      };
    }

    if (field.type === 'saving') {
      const abilityScore = character.abilities[field.key];
      const abilityLabel = ABILITIES_BY_KEY[field.key].label;
      const proficient = character.savingThrows[field.key].proficient;
      const abilityModifier = getAbilityModifierFromTotal(abilityScore);
      const savingThrowModifier = getDerivedModifier(
        formatAbilityTotal(abilityScore),
        getProficiencyMultiplier(proficient, false),
        proficiencyBonus
      );
      return {
        title: `Salvaguarda de ${abilityLabel}`,
        rows: [
          { label: `Modificador de ${abilityLabel}`, value: formatSignedModifier(abilityModifier) },
          {
            label: 'Bônus de Proficiência',
            value: formatSignedModifier(proficient ? (proficiencyBonus ?? 0) : 0),
            note: proficient ? undefined : 'Não proficiente',
          },
        ],
        totalLabel: 'Total',
        totalValue: formatSignedModifier(savingThrowModifier),
      };
    }

    if (field.type === 'skill') {
      const skill = SKILLS.find((s) => s.key === field.key)!;
      const skillState = character.skills[field.key];
      const abilityScore = character.abilities[skill.ability];
      const abilityLabel = ABILITIES_BY_KEY[skill.ability].label;
      const multiplier = getProficiencyMultiplier(skillState.proficient, skillState.expertise);
      const abilityModifier = getAbilityModifierFromTotal(abilityScore);
      const skillModifier = getDerivedModifier(formatAbilityTotal(abilityScore), multiplier, proficiencyBonus);
      const note = !skillState.proficient
        ? 'Não proficiente'
        : skillState.expertise
          ? 'Especialização (bônus dobrado)'
          : undefined;
      return {
        title: skill.label,
        rows: [
          { label: `Modificador de ${abilityLabel}`, value: formatSignedModifier(abilityModifier) },
          {
            label: 'Bônus de Proficiência',
            value: formatSignedModifier(multiplier > 0 ? (proficiencyBonus ?? 0) * multiplier : 0),
            note,
          },
        ],
        totalLabel: 'Total',
        totalValue: formatSignedModifier(skillModifier),
      };
    }

    const proficient = character.tools[field.key]?.proficient ?? false;
    return {
      title: field.label,
      rows: [{ label: 'Proficiente', value: proficient ? 'Sim' : 'Não' }],
      totalLabel: 'Bônus de Proficiência',
      totalValue: formatSignedModifier(proficient ? (proficiencyBonus ?? 0) : 0),
    };
  }

  const breakdown = getBreakdown(openField);

  function renderSkillColumn(skills: typeof SKILLS) {
    return skills.map((skill) => {
      const skillState = character.skills[skill.key];
      const skillModifier = getDerivedModifier(
        formatAbilityTotal(character.abilities[skill.ability]),
        getProficiencyMultiplier(skillState.proficient, skillState.expertise),
        proficiencyBonus
      );

      return (
        <Pressable key={skill.key} onPress={() => setOpenField({ type: 'skill', key: skill.key })}>
          <SkillRow
            label={`${skill.label} (${ABILITIES_BY_KEY[skill.ability].abbr})`}
            proficient={skillState.proficient}
            expertise={skillState.expertise}
            modifier={formatSignedModifier(skillModifier)}
          />
        </Pressable>
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
              <Pressable
                key={ability.key}
                style={styles.abilityCard}
                onPress={() => setOpenField({ type: 'ability', key: ability.key })}
              >
                <AbilityCard label={ability.label} score={total} modifier={formatSignedModifier(abilityModifier)} />
              </Pressable>
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
              <Pressable
                key={ability.key}
                style={styles.savingThrowRow}
                onPress={() => setOpenField({ type: 'saving', key: ability.key })}
              >
                <SavingThrowRow
                  label={ability.label}
                  proficient={character.savingThrows[ability.key].proficient}
                  modifier={formatSignedModifier(savingThrowModifier)}
                />
              </Pressable>
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
              <Pressable key={key} onPress={() => setOpenField({ type: 'tool', key, label: item.name })}>
                <ToolRow label={item.name} proficient={character.tools[key]?.proficient ?? false} />
              </Pressable>
            );
          })
        )}
      </View>

      <StatBreakdownModal
        visible={openField !== null}
        title={breakdown?.title ?? ''}
        rows={breakdown?.rows ?? []}
        totalLabel={breakdown?.totalLabel ?? ''}
        totalValue={breakdown?.totalValue ?? ''}
        onClose={() => setOpenField(null)}
      />
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
