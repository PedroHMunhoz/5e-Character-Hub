import { useMemo } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { CharacterListItem } from '@/components/character/character-list-item';
import { getRandomPortraitUri } from '@/components/character/portrait-placeholder';
import { formatClassesLabel } from '@/utils/character-summary';
import { getCharacterLevel } from '@/utils/proficiency';
import type { CharacterSummary } from '@/types/character';

const SAMPLE_CHARACTERS: CharacterSummary[] = [
  {
    id: 'sample-1',
    name: 'Elyndra Sunwhisper',
    race: 'Elfo da Floresta',
    classes: [{ id: 'c1', name: 'Mago', level: '5' }],
  },
  {
    id: 'sample-2',
    name: 'Borin Rochaviva',
    race: 'Anão da Colina',
    classes: [
      { id: 'c1', name: 'Mago', level: '1' },
      { id: 'c2', name: 'Guerreiro', level: '3' },
      { id: 'c3', name: 'Ladino', level: '2' },
    ],
  },
  {
    id: 'sample-3',
    name: 'Sable Nightshade',
    race: 'Humano',
    classes: [{ id: 'c1', name: 'Ladino', level: '2' }],
  },
];

export function CharacterList() {
  const portraitUris = useMemo(
    () => Object.fromEntries(SAMPLE_CHARACTERS.map((character) => [character.id, getRandomPortraitUri()])),
    []
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      {SAMPLE_CHARACTERS.map((character) => (
        <CharacterListItem
          key={character.id}
          name={character.name}
          race={character.race}
          classesLabel={formatClassesLabel(character.classes)}
          level={getCharacterLevel(character.classes)}
          portraitUri={portraitUris[character.id]}
          onPress={() => {}}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 8,
  },
});
