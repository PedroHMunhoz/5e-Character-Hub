import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { ABILITIES_BY_KEY } from '@/constants/character';
import { getFeatById } from '@/data/queries/feats';
import { useCharacter } from '@/hooks/use-character';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Feat } from '@/types/reference';

export default function FeatDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { character } = useCharacter();
  const goldColor = useThemeColor({}, 'gold');

  const [feat, setFeat] = useState<Feat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getFeatById(db, Number(id)).then((data) => {
      if (!cancelled) {
        setFeat(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [db, id]);

  if (loading || !feat) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={goldColor} />
      </View>
    );
  }

  const abilityChoice = (character.feats ?? []).find((entry) => entry.featId === feat.id)?.abilityChoice ?? null;

  return (
    <>
      <Stack.Screen options={{ title: feat.name }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
        <View style={[styles.field, styles.descriptionField, { borderColor: goldColor }]}>
          <ThemedText style={styles.fieldLabel}>Descrição</ThemedText>
          {feat.entries.map((entry, index) => (
            <ThemedText key={index} style={styles.descriptionParagraph}>
              {entry}
            </ThemedText>
          ))}
        </View>

        {abilityChoice ? (
          <View style={[styles.field, { borderColor: goldColor }]}>
            <ThemedText style={styles.fieldLabel}>Bônus de Talento</ThemedText>
            <ThemedText style={styles.fieldValue}>+1 {ABILITIES_BY_KEY[abilityChoice].label}</ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: 16,
    gap: 16,
  },
  field: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  descriptionField: {
    gap: 8,
  },
  descriptionParagraph: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
  },
});
