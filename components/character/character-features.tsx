import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { CollapsibleSection } from '@/components/character/collapsible-section';
import { FeatureItemCard } from '@/components/character/feature-item-card';
import { getCuratedCharacterFeatures, type CuratedFeature, type FeatureSectionKey } from '@/data/queries/character-features';
import { useCharacter } from '@/hooks/use-character';
import { useThemeColor } from '@/hooks/use-theme-color';

const FEATURE_SECTION_LABELS: { key: FeatureSectionKey | 'outras'; label: string }[] = [
  { key: 'classe', label: 'Características de Classe' },
  { key: 'racial', label: 'Características Raciais' },
  { key: 'antecedente', label: 'Características do Antecedente' },
  { key: 'outras', label: 'Outras Características' },
];

export function CharacterFeatures() {
  const db = useSQLiteContext();
  const { character } = useCharacter();
  const [features, setFeatures] = useState<CuratedFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const goldColor = useThemeColor({}, 'gold');

  useEffect(() => {
    getCuratedCharacterFeatures(db).then((data) => {
      setFeatures(data);
      setLoading(false);
    });
  }, [db]);

  const sections = useMemo(
    () =>
      FEATURE_SECTION_LABELS.map((section) => ({
        ...section,
        items: features.filter((feature) => feature.section === section.key),
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
            {section.items.map((item) => (
              <FeatureItemCard
                key={item.id}
                name={item.name}
                usageType={item.usageType}
                maxUses={item.maxUses}
                usesCurrent={character.features[item.id]?.usesCurrent ?? item.maxUses ?? '0'}
                recovery={item.recovery}
              />
            ))}
          </View>
        </CollapsibleSection>
      ))}
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
