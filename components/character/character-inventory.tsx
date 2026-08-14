import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { CollapsibleSection } from '@/components/character/collapsible-section';
import { ConfirmModal } from '@/components/character/confirm-modal';
import { CurrencyInput } from '@/components/character/currency-input';
import { EquipmentItemCard } from '@/components/character/equipment-item-card';
import { MessageModal } from '@/components/character/message-modal';
import { StackableItemCard } from '@/components/character/stackable-item-card';
import { VitalBar } from '@/components/character/vital-bar';
import { CURRENCY_FIELDS, INVENTORY_CATEGORY_SECTIONS } from '@/constants/inventory';
import { formatWeightKg, getBaseItemsByIds, getWeightKg, type CuratedBaseItem } from '@/data/queries/base-items';
import { parseItemKey } from '@/data/queries/equipment-lookup';
import { getItemsByIds } from '@/data/queries/items';
import { useCharacter } from '@/hooks/use-character';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { WeaponSlot } from '@/types/character';
import { getAbilityTotal } from '@/utils/ability-modifier';

// Same flat "1 kg ~= 2 lb" rule used everywhere else in the app (see
// getWeightKg/formatWeightKg in data/queries/base-items.ts).
const KG_PER_LB = 0.5;
// RAW carrying capacity (PHB): Strength score x 15 lb, no optional
// encumbrance variant - see docs/TODO.md.
const CARRY_CAPACITY_KG_PER_STR = 15 * KG_PER_LB;
// RAW (PHB): every 50 coins, of any denomination, weigh 1 lb.
const COINS_PER_LB = 50;

function formatKg(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return String(rounded).replace('.', ',');
}

// A display item carries its inventoryItems key (namespaced for `items`-
// table rows - see data/queries/equipment-lookup.ts's itemKey) alongside
// the fields the existing cards render. `items`-table rows (packs, kits,
// general gear granted by the creation wizard) have no weapon/armor stats
// and, unlike base_items, no detail screen to navigate to yet
// (app/sheet/[characterId]/item/[id].tsx only resolves base_items ids) -
// see docs/TODO.md.
interface DisplayItem extends CuratedBaseItem {
  key: string;
  navigable: boolean;
}

export function CharacterInventory() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { character, setCurrencyField, toggleArmorEquipped, toggleWeaponEquipped, setWeaponSlot } = useCharacter();
  const [items, setItems] = useState<DisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [shieldConfirm, setShieldConfirm] = useState<{ id: string; slot: WeaponSlot } | null>(null);
  const goldColor = useThemeColor({}, 'gold');

  const inventoryKeys = useMemo(() => Object.keys(character.inventoryItems), [character.inventoryItems]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const baseItemIds: number[] = [];
      const itemIds: number[] = [];
      const quantityById = new Map<number, number>();
      for (const key of inventoryKeys) {
        const parsed = parseItemKey(key);
        (parsed.source === 'base_items' ? baseItemIds : itemIds).push(parsed.id);
        if (parsed.source === 'base_items') {
          quantityById.set(parsed.id, Number(character.inventoryItems[key]?.quantity ?? '1') || 1);
        }
      }

      // Sequential, not Promise.all: overlapping queries on the same
      // SQLiteDatabase connection can crash on native (see data/queries/spells.ts).
      const baseItems = await getBaseItemsByIds(db, baseItemIds, quantityById);
      if (cancelled) return;
      const generalItems = await getItemsByIds(db, itemIds);
      if (cancelled) return;

      const display: DisplayItem[] = [
        ...baseItems.map((item) => ({ ...item, key: String(item.id), navigable: true })),
        ...generalItems.map((item) => ({
          key: `item:${item.id}`,
          navigable: false,
          id: item.id,
          category: 'general' as const,
          name: item.name,
          weight: formatWeightKg(item.name, item.weightLb),
          weightKg: getWeightKg(item.name, item.weightLb),
        })),
      ];
      setItems(display);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [db, inventoryKeys]);

  const sections = useMemo(
    () =>
      INVENTORY_CATEGORY_SECTIONS.map((section) => ({
        ...section,
        items: items.filter((item) => item.category === section.category),
      })),
    [items]
  );

  const totalWeightKg = useMemo(() => {
    const itemsWeightKg = items.reduce((sum, item) => {
      const quantity = Number(character.inventoryItems[item.key]?.quantity ?? '1') || 1;
      return sum + item.weightKg * quantity;
    }, 0);
    const coinCount = CURRENCY_FIELDS.reduce((sum, field) => sum + (Number(character.currency[field.key]) || 0), 0);
    const coinsWeightKg = (coinCount / COINS_PER_LB) * KG_PER_LB;
    return itemsWeightKg + coinsWeightKg;
  }, [items, character.inventoryItems, character.currency]);

  const maxCapacityKg = useMemo(
    () => (getAbilityTotal(character.abilities.str) ?? 0) * CARRY_CAPACITY_KG_PER_STR,
    [character.abilities.str]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={goldColor} />
      </View>
    );
  }

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <VitalBar
          label="Capacidade de Carga"
          current={formatKg(totalWeightKg)}
          max={formatKg(maxCapacityKg)}
          gradientColors={['#4a2f1a', '#8a5a2a']}
        />

        <CollapsibleSection title="Moedas">
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
        </CollapsibleSection>

        {sections.map((section) => (
          <CollapsibleSection key={section.key} title={section.label}>
            <View style={styles.cardList}>
              {section.items.map((item) => {
                const itemId = String(item.id);

                if (section.category === 'weapon' || section.category === 'armor') {
                  const isWeapon = section.category === 'weapon';
                  return (
                    <Pressable
                      key={itemId}
                      onPress={() =>
                        router.push({ pathname: '/sheet/[characterId]/item/[id]', params: { characterId: character.id, id: itemId } })
                      }
                    >
                      <EquipmentItemCard
                        name={item.name}
                        properties={item.properties}
                        weight={item.weight}
                        statValue={isWeapon ? item.damageDice : item.armorClassBonus}
                        statIcon={isWeapon ? 'sword' : 'shield'}
                        equipped={
                          isWeapon
                            ? character.inventoryItems[itemId]?.weaponSlot != null
                            : character.inventoryItems[itemId]?.armorSlot != null
                        }
                        onToggleEquipped={() => {
                          if (isWeapon) {
                            const outcome = toggleWeaponEquipped(itemId, item.handedness ?? 'oneHanded');
                            if (outcome.kind === 'blocked') setBlockedMessage(outcome.message);
                            else if (outcome.kind === 'confirmShieldUnequip') {
                              setShieldConfirm({ id: itemId, slot: outcome.slot });
                            }
                            return;
                          }
                          const message = toggleArmorEquipped(itemId, item.armorSlotKind ?? 'body');
                          if (message) setBlockedMessage(message);
                        }}
                      />
                    </Pressable>
                  );
                }

                const isConsumable = section.category === 'consumable';
                const card = (
                  <StackableItemCard
                    name={item.name}
                    properties={item.properties}
                    weight={item.weight}
                    quantity={
                      isConsumable
                        ? (character.inventoryItems[item.key]?.quantity ?? item.defaultQuantity ?? '1')
                        : undefined
                    }
                  />
                );

                if (!item.navigable) {
                  return <View key={item.key}>{card}</View>;
                }

                return (
                  <Pressable
                    key={item.key}
                    onPress={() =>
                      router.push({ pathname: '/sheet/[characterId]/item/[id]', params: { characterId: character.id, id: item.key } })
                    }
                  >
                    {card}
                  </Pressable>
                );
              })}
            </View>
          </CollapsibleSection>
        ))}
      </ScrollView>

      <MessageModal
        visible={blockedMessage != null}
        title="Atenção"
        message={blockedMessage ?? undefined}
        onClose={() => setBlockedMessage(null)}
      />

      <ConfirmModal
        visible={shieldConfirm != null}
        title="Atenção"
        message="Equipar esta arma vai desequipar o escudo atual. Deseja continuar?"
        onCancel={() => setShieldConfirm(null)}
        onConfirm={() => {
          if (shieldConfirm) setWeaponSlot(shieldConfirm.id, shieldConfirm.slot);
          setShieldConfirm(null);
        }}
      />
    </>
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
