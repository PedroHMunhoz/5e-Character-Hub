import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { CharacterListItem } from '@/components/character/character-list-item';
import { ConfirmModal } from '@/components/character/confirm-modal';
import { getRandomPortraitUri } from '@/components/character/portrait-placeholder';
import { ThemedText } from '@/components/themed-text';
import { useCharacterDb } from '@/context/character-db-context';
import { deleteCharacter, getAllCharacterSummaries } from '@/data/queries/player-characters';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatClassesLabel } from '@/utils/character-summary';
import { getCharacterLevel } from '@/utils/proficiency';
import type { CharacterSummary } from '@/types/character';

export function CharacterList() {
  const db = useCharacterDb();
  const router = useRouter();
  const goldColor = useThemeColor({}, 'gold');
  const [characters, setCharacters] = useState<CharacterSummary[] | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CharacterSummary | null>(null);

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    await deleteCharacter(db, pendingDelete.id);
    setCharacters((current) => current?.filter((character) => character.id !== pendingDelete.id) ?? current);
    setPendingDelete(null);
  }

  useEffect(() => {
    let cancelled = false;
    getAllCharacterSummaries(db).then((data) => {
      if (!cancelled) setCharacters(data);
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  const portraitUris = useMemo(
    () => Object.fromEntries((characters ?? []).map((character) => [character.id, getRandomPortraitUri()])),
    [characters]
  );

  if (characters === null) {
    return (
      <ScrollView contentContainerStyle={styles.loadingContainer}>
        <ActivityIndicator size="large" color={goldColor} />
      </ScrollView>
    );
  }

  if (characters.length === 0) {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.emptyContainer}>
        <ThemedText style={styles.emptyText}>
          Nenhum personagem ainda. Toque em &quot;+&quot; para criar o primeiro.
        </ThemedText>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        {characters.map((character) => (
          <CharacterListItem
            key={character.id}
            name={character.name}
            race={character.race}
            classesLabel={formatClassesLabel(character.classes)}
            level={getCharacterLevel(character.classes)}
            portraitUri={portraitUris[character.id]}
            onPress={() => router.push({ pathname: '/sheet/[characterId]', params: { characterId: character.id } })}
            onLongPress={() => setPendingDelete(character)}
          />
        ))}
      </ScrollView>
      <ConfirmModal
        visible={pendingDelete != null}
        title="Excluir personagem"
        message={`Tem certeza que deseja excluir ${pendingDelete?.name}? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.7,
  },
});
