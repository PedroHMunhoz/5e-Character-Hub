import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { CollapsibleSection } from '@/components/character/collapsible-section';
import { PurchaseSummaryModal } from '@/components/character/purchase-summary-modal';
import { ShopItemRow } from '@/components/character/shop-item-row';
import { ThemedText } from '@/components/themed-text';
import { INVENTORY_CATEGORY_SECTIONS, SHOP_LOADING_MESSAGES } from '@/constants/inventory';
import { getShopCatalog, type ShopCatalogItem } from '@/data/queries/shop-catalog';
import {
  buildPurchaseSummaryLines,
  computeCartTotalCp,
  explodeCartToGrants,
  filterShopCatalog,
  type ShopCart,
} from '@/data/wizard/item-purchase';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatCurrencyBreakdown } from '@/utils/currency';
import { sortByLocalizedName } from '@/utils/sort-by-name';

// Reusable "buy items with gold" screen - purely controlled by props (no
// wizard/character-context dependency), so it works both mid-creation
// (invoked with the wizard's rolled gold) and, in the future, from the
// character sheet's Inventory tab (invoked with the character's own PO) -
// the caller owns what "available gold" means and what happens once the
// player confirms. Owns its own full-screen layout (scrollable list + fixed
// confirm button + summary modal) so a routed screen (app/wizard/shop.tsx)
// can mount it directly as the screen body.
interface ItemShopProps {
  // PO available at the moment this screen is invoked, in copper pieces.
  availableCp: number;
  // Re-seeds the cart on mount - lets a caller that persists the cart
  // (see WizardDraft.purchaseCart) restore a previous selection instead of
  // always starting empty (e.g. after navigating back to this step).
  initialCart?: ShopCart;
  onCartChange: (cart: ShopCart, grants: ReturnType<typeof explodeCartToGrants>, totalCostCp: number) => void;
  // Label for the bottom confirm button (e.g. "Comprar").
  confirmLabel: string;
  // Called once the player confirms - after the summary modal is dismissed,
  // or immediately if the cart is empty (nothing to summarize).
  onConfirm: () => void;
}

export function ItemShop({ availableCp, initialCart, onCartChange, confirmLabel, onConfirm }: ItemShopProps) {
  const db = useSQLiteContext();
  const goldColor = useThemeColor({}, 'gold');
  const textColor = useThemeColor({}, 'text');
  const [catalog, setCatalog] = useState<ShopCatalogItem[] | null>(null);
  const [cart, setCart] = useState<ShopCart>(initialCart ?? {});
  const [search, setSearch] = useState('');
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [loadingMessage] = useState(
    () => SHOP_LOADING_MESSAGES[Math.floor(Math.random() * SHOP_LOADING_MESSAGES.length)]
  );

  useEffect(() => {
    let cancelled = false;
    getShopCatalog(db).then((result) => {
      if (!cancelled) setCatalog(result);
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  const catalogByKey = useMemo(() => new Map((catalog ?? []).map((item) => [item.key, item])), [catalog]);

  const totalCostCp = useMemo(() => computeCartTotalCp(cart, catalogByKey), [cart, catalogByKey]);
  const remainingCp = availableCp - totalCostCp;
  const summaryLines = useMemo(() => buildPurchaseSummaryLines(cart, catalogByKey), [cart, catalogByKey]);

  useEffect(() => {
    // Skip while the catalog is still loading - catalogByKey would be empty,
    // so this would otherwise briefly report an empty explosion/zero total
    // even when `cart` (re-seeded from initialCart) already has entries.
    if (catalog === null) return;
    onCartChange(cart, explodeCartToGrants(cart, catalogByKey), totalCostCp);
    // onCartChange intentionally excluded - callers pass an inline closure,
    // and only the cart/catalog actually determine the reported grants.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, catalog, catalogByKey, totalCostCp]);

  const sections = useMemo(() => {
    const filtered = filterShopCatalog(catalog ?? [], search);
    return INVENTORY_CATEGORY_SECTIONS.map((section) => ({
      ...section,
      items: sortByLocalizedName(filtered.filter((item) => item.category === section.category)),
    }));
  }, [catalog, search]);

  function setQuantity(key: string, quantity: number) {
    setCart((prev) => {
      if (quantity <= 0) {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: quantity };
    });
  }

  function handleConfirmPress() {
    // Nothing to summarize - confirm outright instead of showing an empty
    // modal.
    if (summaryLines.length === 0) {
      onConfirm();
      return;
    }
    setSummaryVisible(true);
  }

  if (catalog === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={goldColor} />
        <ThemedText style={[styles.loadingMessage, { color: goldColor }]}>{loadingMessage}</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <ThemedText style={[styles.remaining, { color: goldColor }]}>Restante: {formatCurrencyBreakdown(remainingCp)}</ThemedText>

        <View style={[styles.searchRow, { borderColor: goldColor }]}>
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar itens..."
            placeholderTextColor={goldColor}
          />
        </View>

        {sections.map((section) => (
          <CollapsibleSection key={section.key} title={section.label}>
            <View style={styles.cardList}>
              {section.items.map((item) => (
                <ShopItemRow
                  key={item.key}
                  item={item}
                  quantity={cart[item.key] ?? 0}
                  remainingCp={remainingCp}
                  onChangeQuantity={(quantity) => setQuantity(item.key, quantity)}
                />
              ))}
            </View>
          </CollapsibleSection>
        ))}
      </ScrollView>

      <View style={[styles.footer, { borderColor: goldColor }]}>
        <Pressable onPress={handleConfirmPress} style={[styles.confirmButton, { borderColor: goldColor }]}>
          <ThemedText style={[styles.confirmButtonText, { color: goldColor }]}>{confirmLabel}</ThemedText>
        </Pressable>
      </View>

      <PurchaseSummaryModal
        visible={summaryVisible}
        lines={summaryLines}
        totalCostCp={totalCostCp}
        remainingCp={remainingCp}
        onClose={() => {
          setSummaryVisible(false);
          onConfirm();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignSelf: 'stretch',
  },
  loadingContainer: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingMessage: {
    fontSize: 15,
    fontStyle: 'italic',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  remaining: {
    fontSize: 16,
    fontWeight: '700',
  },
  searchRow: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    fontSize: 15,
  },
  cardList: {
    gap: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  confirmButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
