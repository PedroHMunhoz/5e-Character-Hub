import { ScrollView, StyleSheet, View } from 'react-native';

import { CollapsibleSection } from '@/components/character/collapsible-section';
import { CurrencyInput } from '@/components/character/currency-input';
import { EquipmentItemCard } from '@/components/character/equipment-item-card';
import { StackableItemCard } from '@/components/character/stackable-item-card';
import { CURRENCY_FIELDS, INVENTORY_SECTIONS } from '@/constants/inventory';
import { useCharacter } from '@/hooks/use-character';

export function CharacterInventory() {
  const { character, setCurrencyField, toggleItemEquipped } = useCharacter();

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

      {INVENTORY_SECTIONS.map((section) => (
        <CollapsibleSection key={section.key} title={section.label}>
          <View style={styles.cardList}>
            {section.items.map((item) => {
              if (section.category === 'weapon' || section.category === 'armor') {
                return (
                  <EquipmentItemCard
                    key={item.id}
                    name={item.name}
                    properties={item.properties}
                    weight={item.weight}
                    statValue={section.category === 'weapon' ? item.damageDice : item.armorClassBonus}
                    statIcon={section.category === 'weapon' ? 'sword' : 'shield'}
                    equipped={character.inventoryItems[item.id]?.equipped ?? false}
                    onToggleEquipped={() => toggleItemEquipped(item.id)}
                  />
                );
              }

              return (
                <StackableItemCard
                  key={item.id}
                  name={item.name}
                  properties={item.properties}
                  weight={item.weight}
                  quantity={character.inventoryItems[item.id]?.quantity ?? item.defaultQuantity ?? '1'}
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
