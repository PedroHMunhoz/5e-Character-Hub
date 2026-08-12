import { StyleSheet, View } from 'react-native';

import { SpellRow } from '@/components/character/spell-row';
import { ThemedText } from '@/components/themed-text';
import { SPELL_SCHOOL_LABELS } from '@/constants/spells';
import type { Spell } from '@/types/reference';

interface SpellPickerProps {
  title: string;
  spells: Spell[];
  count: number;
  selected: number[];
  onChange: (selected: number[]) => void;
}

export function SpellPicker({ title, spells, count, selected, onChange }: SpellPickerProps) {
  function toggle(id: number) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
      return;
    }
    if (selected.length >= count) return;
    onChange([...selected, id]);
  }

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        {title} ({selected.length}/{count})
      </ThemedText>
      {spells.map((spell) => {
        const isSelected = selected.includes(spell.id);
        return (
          <SpellRow
            key={spell.id}
            name={spell.name}
            school={SPELL_SCHOOL_LABELS[spell.school] ?? spell.school}
            ritual={spell.ritual}
            prepared={isSelected}
            preparedDimmed={!isSelected && selected.length >= count}
            onTogglePrepared={() => toggle(spell.id)}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  title: {
    fontSize: 16,
  },
});
