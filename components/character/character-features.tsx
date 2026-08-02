import { ScrollView, StyleSheet, View } from 'react-native';

import { CollapsibleSection } from '@/components/character/collapsible-section';
import { FeatureItemCard } from '@/components/character/feature-item-card';
import { FEATURE_SECTIONS } from '@/constants/features';
import { useCharacter } from '@/hooks/use-character';

export function CharacterFeatures() {
  const { character } = useCharacter();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      {FEATURE_SECTIONS.map((section) => (
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
  content: {
    padding: 16,
    gap: 20,
  },
  cardList: {
    gap: 8,
  },
});
