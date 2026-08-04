import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { CollapsibleSection } from '@/components/character/collapsible-section';
import { CurrencyInput } from '@/components/character/currency-input';
import { EquipmentItemCard } from '@/components/character/equipment-item-card';
import { StackableItemCard } from '@/components/character/stackable-item-card';
import { CURRENCY_FIELDS, INVENTORY_CATEGORY_SECTIONS } from '@/constants/inventory';
import { getCuratedInventoryBaseItems, type CuratedBaseItem } from '@/data/queries/base-items';
import { useCharacter } from '@/hooks/use-character';
import { useThemeColor } from '@/hooks/use-theme-color';

export function CharacterInventory() {
  const db = useSQLiteContext();
  const { character, setCurrencyField, toggleItemEquipped } = useCharacter();
  const [items, setItems] = useState<CuratedBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const goldColor = useThemeColor({}, 'gold');

  useEffect(() => {
    getCuratedInventoryBaseItems(db).then((data) => {
      setItems(data);
      setLoading(false);
    });
  }, [db]);

  const sections = useMemo(
    () =>
      INVENTORY_CATEGORY_SECTIONS.map((section) => ({
        ...section,
        items: items.filter((item) => item.category === section.category),
      })),
    [items]
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
      <View style={styles.currencyRow}>
        {CURRENCY_FIELDS.map((field) => (
          <CurrencyInput
            key={field.key}
            label={field.label}
            value={character.currency[field.key]}
            onChangeText={(value) => setCurrencyField(field.key, value)}
          />
        ))}
      </View>

      {sections.map((section) => (
        <CollapsibleSection key={section.key} title={section.label}>
          <View style={styles.cardList}>
            {section.items.map((item) => {
              const itemId = String(item.id);

              if (section.category === 'weapon' || section.category === 'armor') {
                return (
                  <EquipmentItemCard
                    key={itemId}
                    name={item.name}
                    properties={item.properties}
                    weight={item.weight}
                    statValue={section.category === 'weapon' ? item.damageDice : item.armorClassBonus}
                    statIcon={section.category === 'weapon' ? 'sword' : 'shield'}
                    equipped={character.inventoryItems[itemId]?.equipped ?? false}
                    onToggleEquipped={() => toggleItemEquipped(itemId)}
                  />
                );
              }

              return (
                <StackableItemCard
                  key={itemId}
                  name={item.name}
                  properties={item.properties}
                  weight={item.weight}
                  quantity={character.inventoryItems[itemId]?.quantity ?? item.defaultQuantity ?? '1'}
                />
              );
            })}
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
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardList: {
    gap: 8,
  },
});
