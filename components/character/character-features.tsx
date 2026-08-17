import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { CollapsibleSection } from '@/components/character/collapsible-section';
import { FeatureItemCard } from '@/components/character/feature-item-card';
import { getCharacterFeatures, type CuratedFeature, type FeatureSectionKey } from '@/data/queries/character-features';
import { getFeatsByIds } from '@/data/queries/feats';
import { useCharacter } from '@/hooks/use-character';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getCharacterLevel } from '@/utils/proficiency';
import { sortByLocalizedName } from '@/utils/sort-by-name';
import type { Feat } from '@/types/reference';

const FEATURE_SECTION_LABELS: { key: FeatureSectionKey | 'outras'; label: string }[] = [
  { key: 'classe', label: 'Características de Classe' },
  { key: 'racial', label: 'Características Raciais' },
  { key: 'antecedente', label: 'Características do Antecedente' },
  { key: 'outras', label: 'Outras Características' },
];

export function CharacterFeatures() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { character } = useCharacter();
  const [features, setFeatures] = useState<CuratedFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [feats, setFeats] = useState<Feat[]>([]);
  const goldColor = useThemeColor({}, 'gold');

  const featIds = character.feats ?? [];
  useEffect(() => {
    getFeatsByIds(db, featIds.map((f) => f.featId)).then(setFeats);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, featIds.map((f) => f.featId).join(',')]);

  const { raceId, subraceId, backgroundId } = character;
  const classId = character.classes[0]?.classId;
  const subclassId = character.classes[0]?.subclassId ?? null;

  useEffect(() => {
    if (raceId == null || classId == null || backgroundId == null) {
      setFeatures([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getCharacterFeatures(db, {
      raceId,
      subraceId: subraceId ?? null,
      classId,
      subclassId,
      backgroundId,
      level: getCharacterLevel(character.classes),
      favoredEnemyType: character.favoredEnemyType,
      favoredEnemyHumanoidRaces: character.favoredEnemyHumanoidRaces,
      favoredTerrainType: character.favoredTerrainType,
    }).then((data) => {
      setFeatures(data);
      setLoading(false);
    });
  }, [
    db,
    raceId,
    subraceId,
    classId,
    subclassId,
    backgroundId,
    character.classes,
    character.favoredEnemyType,
    character.favoredEnemyHumanoidRaces,
    character.favoredTerrainType,
  ]);

  const sections = useMemo(
    () =>
      FEATURE_SECTION_LABELS.map((section) => ({
        ...section,
        items: sortByLocalizedName(features.filter((feature) => feature.section === section.key)),
      })),
    [features]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={goldColor} />
      </View>
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      {sections.map((section) => (
        <CollapsibleSection key={section.key} title={section.label}>
          <View style={styles.cardList}>
            {section.items.map((item) => {
              const card = (
                <FeatureItemCard
                  name={item.name}
                  usageType={item.usageType}
                  maxUses={item.maxUses}
                  usesCurrent={character.features[item.id]?.usesCurrent ?? item.maxUses ?? '0'}
                  recovery={item.recovery}
                />
              );

              return (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    router.push({
                      pathname: '/sheet/[characterId]/feature/[id]',
                      params: { characterId: character.id, id: item.id },
                    })
                  }
                >
                  {card}
                </Pressable>
              );
            })}
          </View>
        </CollapsibleSection>
      ))}

      {feats.length > 0 ? (
        <CollapsibleSection title="Talentos">
          <View style={styles.cardList}>
            {sortByLocalizedName(feats).map((feat) => (
              <Pressable
                key={feat.id}
                onPress={() =>
                  router.push({
                    pathname: '/sheet/[characterId]/feat/[id]',
                    params: { characterId: character.id, id: String(feat.id) },
                  })
                }
              >
                <FeatureItemCard name={feat.name} usageType="passiva" />
              </Pressable>
            ))}
          </View>
        </CollapsibleSection>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 20,
  },
  cardList: {
    gap: 8,
  },
});
