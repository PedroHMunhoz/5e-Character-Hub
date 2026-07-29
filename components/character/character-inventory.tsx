import { ScrollView, StyleSheet, View } from 'react-native';

import { CollapsibleSection } from '@/components/character/collapsible-section';
import { CurrencyInput } from '@/components/character/currency-input';
import { InventoryItemRow } from '@/components/character/inventory-item-row';
import { CURRENCY_FIELDS, INVENTORY_SECTIONS } from '@/constants/inventory';
import { useCharacter } from '@/hooks/use-character';

export function CharacterInventory() {
  const { character, setCurrencyField, setItemQuantity, toggleItemEquipped } = useCharacter();

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
          {section.items.map((item, index) => (
            <InventoryItemRow
              key={item.id}
              name={item.name}
              subtitle={item.subtitle}
              alternate={index % 2 === 1}
              quantity={character.inventoryItems[item.id]?.quantity ?? '1'}
              onQuantityChange={(value) => setItemQuantity(item.id, value)}
              equipped={character.inventoryItems[item.id]?.equipped ?? false}
              onToggleEquipped={() => toggleItemEquipped(item.id)}
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
  currencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
});
