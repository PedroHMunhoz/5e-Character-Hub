import { ScrollView, StyleSheet } from 'react-native';

import { CollapsibleSection } from '@/components/character/collapsible-section';
import { FeatureItemRow, RECOVERY_COLUMN_WIDTH, USES_COLUMN_WIDTH } from '@/components/character/feature-item-row';
import { FEATURE_SECTIONS } from '@/constants/features';
import { useCharacter } from '@/hooks/use-character';

const COLUMNS = [
  { label: 'USOS', width: USES_COLUMN_WIDTH },
  { label: 'RECARGA', width: RECOVERY_COLUMN_WIDTH },
];

export function CharacterFeatures() {
  const { character, setFeatureUses } = useCharacter();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      {FEATURE_SECTIONS.map((section) => (
        <CollapsibleSection key={section.key} title={section.label} columns={COLUMNS}>
          {section.items.map((item, index) => (
            <FeatureItemRow
              key={item.id}
              name={item.name}
              alternate={index % 2 === 1}
              maxUses={item.maxUses}
              usesCurrent={character.features[item.id]?.usesCurrent ?? item.maxUses ?? '0'}
              onUsesChange={(value) => setFeatureUses(item.id, value)}
              recovery={item.recovery}
            />
          ))}
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
});
