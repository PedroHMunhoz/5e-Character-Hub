import { Pressable, StyleSheet, View } from 'react-native';

import { CheckboxToggle } from '@/components/character/checkbox-toggle';
import { ThemedText } from '@/components/themed-text';
import { ABILITIES_BY_KEY } from '@/constants/character';
import type { AbilityBonusChoiceClause } from '@/data/wizard/race-ability-bonus';
import type { AbilityKey } from '@/types/character';

interface AbilityBonusChoiceProps {
  clause: AbilityBonusChoiceClause;
  selected: AbilityKey[];
  onChange: (selected: AbilityKey[]) => void;
}

// Every PHB race that grants a `choose` ability bonus grants exactly +1 per
// chosen ability (e.g. Half-Elf: "+1 to two abilities of your choice") -
// there's no other amount used anywhere in the 2014 ruleset this app
// targets.
export function AbilityBonusChoice({ clause, selected, onChange }: AbilityBonusChoiceProps) {
  function toggle(key: AbilityKey) {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
      return;
    }
    if (selected.length >= clause.count) return;
    onChange([...selected, key]);
  }

  return (
    <View style={styles.container}>
      <ThemedText style={styles.hint}>
        Escolha {clause.count} para receber +1 ({selected.length}/{clause.count})
      </ThemedText>
      {clause.from.map((key) => (
        <Pressable key={key} style={styles.row} onPress={() => toggle(key)}>
          <CheckboxToggle checked={selected.includes(key)} onToggle={() => toggle(key)} />
          <ThemedText style={styles.label}>{ABILITIES_BY_KEY[key].label}</ThemedText>
        </Pressable>
      ))}
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
