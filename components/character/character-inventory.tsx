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
import { CURRENCY_FIELDS, INVENTORY_CATEGORY_SECTIONS } from '@/constants/inventory';
import { getCuratedInventoryBaseItems, type CuratedBaseItem } from '@/data/queries/base-items';
import { useCharacter } from '@/hooks/use-character';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { WeaponSlot } from '@/types/character';

export function CharacterInventory() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { character, setCurrencyField, toggleArmorEquipped, toggleWeaponEquipped, setWeaponSlot } =
    useCharacter();
  const [items, setItems] = useState<CuratedBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [shieldConfirm, setShieldConfirm] = useState<{ id: string; slot: WeaponSlot } | null>(null);
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
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
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
                      onPress={() => router.push({ pathname: '/item/[id]', params: { id: itemId } })}>
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
                return (
                  <Pressable
                    key={itemId}
                    onPress={() => router.push({ pathname: '/item/[id]', params: { id: itemId } })}>
                    <StackableItemCard
                      name={item.name}
                      properties={item.properties}
                      weight={item.weight}
                      quantity={
                        isConsumable
                          ? (character.inventoryItems[itemId]?.quantity ?? item.defaultQuantity ?? '1')
                          : undefined
                      }
                    />
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
