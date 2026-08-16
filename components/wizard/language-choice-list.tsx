import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { CheckboxToggle } from '@/components/character/checkbox-toggle';
import { ThemedText } from '@/components/themed-text';
import type { Language } from '@/data/queries/languages';

export interface LanguageChoiceClause {
  from: Language[];
  count: number;
}

// A disabled entry can optionally carry a short reason shown next to the
// label (e.g. "Já selecionado pelo Inimigo Favorito") - callers that don't
// have a specific reason (the existing race/background cross-disable) just
// omit `note`.
export interface DisabledLanguage {
  language: Language;
  note?: string;
}

interface LanguageChoiceListProps {
  clause: LanguageChoiceClause;
  selected: number[];
  onChange: (selected: number[]) => void;
  // Languages already granted by some other source (the *other* language
  // pick on this same screen, or a class feature like the Ranger's Favored
  // Enemy) - shown unchecked but non-interactive instead of being filtered
  // out of the list, so the player sees why it's unavailable instead of it
  // silently disappearing from the pool.
  disabled?: DisabledLanguage[];
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

  const disabledById = useMemo(() => new Map(disabled.map((d) => [d.language.id, d])), [disabled]);

  const sortedLanguages = useMemo(
    () => [...clause.from, ...disabled.map((d) => d.language)].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [clause.from, disabled]
  );

  return (
    <View style={styles.container}>
      <ThemedText style={styles.hint}>
        Escolha {clause.count} {clause.count === 1 ? 'idioma' : 'idiomas'} ({selected.length}/{clause.count})
      </ThemedText>
      {sortedLanguages.map((language) => {
        const disabledEntry = disabledById.get(language.id);
        const isLanguageDisabled = disabledEntry !== undefined;
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
            <ThemedText style={[styles.label, isLanguageDisabled && styles.labelDisabled]}>
              {language.name}
              {disabledEntry?.note ? ` (${disabledEntry.note})` : ''}
            </ThemedText>
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
