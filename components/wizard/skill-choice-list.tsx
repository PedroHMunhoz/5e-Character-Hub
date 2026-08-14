import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CheckboxToggle } from '@/components/character/checkbox-toggle';
import { ThemedText } from '@/components/themed-text';
import { SKILLS } from '@/constants/character';
import type { SkillKey } from '@/types/character';
import type { SkillChoiceClause } from '@/data/wizard/skill-proficiency-resolver';

const LABEL_BY_KEY = Object.fromEntries(SKILLS.map((skill) => [skill.key, skill.label])) as Record<SkillKey, string>;

interface SkillChoiceListProps {
  clause: SkillChoiceClause;
  selected: SkillKey[];
  onChange: (selected: SkillKey[]) => void;
}

export function SkillChoiceList({ clause, selected, onChange }: SkillChoiceListProps) {
  function toggle(key: SkillKey) {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
      return;
    }
    if (selected.length >= clause.count) return;
    onChange([...selected, key]);
  }

  // clause.from sometimes comes straight from the DB's raw DSL order (book
  // order, e.g. Rogue's skill pool), not alphabetical pt-BR order - sort by
  // label here so every caller of this component gets a consistent order.
  const sortedKeys = useMemo(
    () => [...clause.from].sort((a, b) => LABEL_BY_KEY[a].localeCompare(LABEL_BY_KEY[b], 'pt-BR')),
    [clause.from]
  );

  return (
    <View style={styles.container}>
      <ThemedText style={styles.hint}>
        Escolha {clause.count} {clause.count === 1 ? 'perícia' : 'perícias'} ({selected.length}/{clause.count})
      </ThemedText>
      {sortedKeys.map((key) => {
        const isSelected = selected.includes(key);
        return (
          <Pressable key={key} style={styles.row} onPress={() => toggle(key)}>
            <CheckboxToggle
              checked={isSelected}
              onToggle={() => toggle(key)}
              dimmed={!isSelected && selected.length >= clause.count}
            />
            <ThemedText style={styles.label}>{LABEL_BY_KEY[key]}</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  hint: {
    fontSize: 13,
    opacity: 0.7,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 15,
  },
});
