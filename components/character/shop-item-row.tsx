import { StyleSheet, View } from 'react-native';

import { ItemIconPlaceholder } from '@/components/character/item-icon-placeholder';
import { QuantityStepper } from '@/components/quantity-stepper';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ShopCatalogItem } from '@/data/queries/shop-catalog';
import { formatCurrencyBreakdown } from '@/utils/currency';

interface ShopItemRowProps {
  item: ShopCatalogItem;
  quantity: number;
  remainingCp: number;
  onChangeQuantity: (quantity: number) => void;
}

export function ShopItemRow({ item, quantity, remainingCp, onChangeQuantity }: ShopItemRowProps) {
  const goldColor = useThemeColor({}, 'gold');
  // Remaining budget already covers the unit this stepper would add back if
  // the player is decrementing, so the max is the current quantity plus
  // however many more units the remaining PO can still afford.
  const maxAffordable = quantity + Math.floor(remainingCp / item.valueCp);

  return (
    <ThemedView style={[styles.card, { borderColor: goldColor }]}>
      <ItemIconPlaceholder badge={quantity > 0 ? String(quantity) : undefined} />
      <View style={styles.info}>
        <ThemedText style={styles.name} numberOfLines={1}>
          {item.name}
        </ThemedText>
        {item.properties ? (
          <ThemedText style={styles.properties} numberOfLines={2}>
            {item.properties}
          </ThemedText>
        ) : null}
        <ThemedText style={[styles.price, { color: goldColor }]}>{formatCurrencyBreakdown(item.valueCp)}</ThemedText>
      </View>
      <QuantityStepper value={quantity} max={maxAffordable} onChange={onChangeQuantity} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  properties: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  price: {
    fontSize: 13,
    fontWeight: '600',
  },
});
