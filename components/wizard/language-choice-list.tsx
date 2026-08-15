import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CheckboxToggle } from '@/components/character/checkbox-toggle';
import { ThemedText } from '@/components/themed-text';
import type { Language } from '@/data/queries/languages';

export interface LanguageChoiceClause {
  from: Language[];
  count: number;
}

interface LanguageChoiceListProps {
  clause: LanguageChoiceClause;
  selected: number[];
  onChange: (selected: number[]) => void;
  // Languages already granted by the *other* language source on this same
  // screen (e.g. a race pick showing up in the background's own list, or
  // vice versa) - shown unchecked but non-interactive instead of being
  // filtered out of the list, so the player sees why it's unavailable
  // instead of it silently disappearing from the pool.
  disabled?: Language[];
}

export function LanguageChoiceList({ clause, selected, onChange, disabled = [] }: LanguageChoiceListProps) {
  function toggle(id: number) {
    if (selected.includes(id)) {
      onChange(selected.filter((selectedId) => selectedId !== id));
      return;
    }
    if (selected.length >= clause.count) return;
    onChange([...selected, id]);
  }

  const disabledIds = useMemo(() => new Set(disabled.map((language) => language.id)), [disabled]);

  const sortedLanguages = useMemo(
    () => [...clause.from, ...disabled].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [clause.from, disabled]
  );

  return (
    <View style={styles.container}>
      <ThemedText style={styles.hint}>
        Escolha {clause.count} {clause.count === 1 ? 'idioma' : 'idiomas'} ({selected.length}/{clause.count})
      </ThemedText>
      {sortedLanguages.map((language) => {
        const isLanguageDisabled = disabledIds.has(language.id);
        const isSelected = selected.includes(language.id);
        return (
          <Pressable
            key={language.id}
            style={styles.row}
            onPress={isLanguageDisabled ? undefined : () => toggle(language.id)}
          >
            <CheckboxToggle
              checked={isSelected}
              onToggle={isLanguageDisabled ? undefined : () => toggle(language.id)}
              dimmed={!isLanguageDisabled && !isSelected && selected.length >= clause.count}
            />
            <ThemedText style={[styles.label, isLanguageDisabled && styles.labelDisabled]}>{language.name}</ThemedText>
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
  labelDisabled: {
    opacity: 0.5,
  },
});
