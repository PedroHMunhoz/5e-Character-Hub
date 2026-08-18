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
import { BREATH_WEAPON_ITEM_ID, getBreathWeaponStats } from '@/constants/draconic-ancestry';
import { CURRENCY_FIELDS, INVENTORY_CATEGORY_SECTIONS } from '@/constants/inventory';
import { formatWeightKg, getBaseItemsByIds, getWeightKg, type CuratedBaseItem } from '@/data/queries/base-items';
import { parseItemKey } from '@/data/queries/equipment-lookup';
import { getItemsByIds } from '@/data/queries/items';
import { useCharacter } from '@/hooks/use-character';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { WeaponSlot } from '@/types/character';
import { getAbilityModifierFromTotal, getAbilityTotal } from '@/utils/ability-modifier';
import { getCharacterLevel, getProficiencyBonus } from '@/utils/proficiency';
import { sortByLocalizedName } from '@/utils/sort-by-name';
import { ARMOR_STRENGTH_SPEED_PENALTY_FEET, feetToMeters, feetToSquares } from '@/utils/speed';

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
// general gear granted by the creation wizard) have no weapon/armor stats,
// so they only ever render as a StackableItemCard, never the weapon/armor
// EquipmentItemCard - but they're just as navigable to a detail screen as
// base_items rows (see app/sheet/[characterId]/item/[id].tsx).
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

  // [instanceId, state][] - one entry per physical inventory row. Weapon/
  // armor grants get one instance per unit (see assemble-character.ts), so
  // this naturally yields one card per copy instead of collapsing duplicates.
  const inventoryEntries = useMemo(() => Object.entries(character.inventoryItems), [character.inventoryItems]);

  // Dragonborn's Breath Weapon is a synthetic, non-catalog weapon (never has
  // a base_items/items row - see constants/draconic-ancestry.ts) whose stats
  // depend on level/CON/proficiency, so it's computed here instead of
  // resolved from the database like every other inventory row below.
  const breathWeaponStats = useMemo(() => {
    if (!character.draconicAncestry) return null;
    const level = getCharacterLevel(character.classes);
    const conModifier = getAbilityModifierFromTotal(character.abilities.con) ?? 0;
    const proficiencyBonus = getProficiencyBonus(level) ?? 0;
    return getBreathWeaponStats(character.draconicAncestry, level, conModifier, proficiencyBonus);
  }, [character.draconicAncestry, character.classes, character.abilities.con]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const baseItemIds = new Set<number>();
      const itemIds = new Set<number>();
      const quantityById = new Map<number, number>();
      const itemsQuantityById = new Map<number, number>();
      for (const [, state] of inventoryEntries) {
        if (state.itemId === BREATH_WEAPON_ITEM_ID) continue;
        const parsed = parseItemKey(state.itemId);
        const quantity = Number(state.quantity ?? '1') || 1;
        if (parsed.source === 'base_items') {
          baseItemIds.add(parsed.id);
          quantityById.set(parsed.id, quantity);
        } else {
          itemIds.add(parsed.id);
          itemsQuantityById.set(parsed.id, quantity);
        }
      }

      // Sequential, not Promise.all: overlapping queries on the same
      // SQLiteDatabase connection can crash on native (see data/queries/spells.ts).
      const baseItems = await getBaseItemsByIds(db, [...baseItemIds], quantityById);
      if (cancelled) return;
      const generalItems = await getItemsByIds(db, [...itemIds]);
      if (cancelled) return;

      const baseItemById = new Map(baseItems.map((item) => [item.id, item]));
      const generalItemById = new Map(generalItems.map((item) => [item.id, item]));

      const display: DisplayItem[] = [];
      for (const [instanceId, state] of inventoryEntries) {
        if (state.itemId === BREATH_WEAPON_ITEM_ID) {
          if (!breathWeaponStats) continue;
          display.push({
            key: instanceId,
            navigable: true,
            id: -1,
            category: 'weapon',
            name: breathWeaponStats.name,
            properties: `${breathWeaponStats.areaLabel} (CD ${breathWeaponStats.saveDC}, ${breathWeaponStats.saveAbilityLabel})`,
            weight: '0',
            weightKg: 0,
            damageDice: breathWeaponStats.damageDice,
          });
          continue;
        }
        const parsed = parseItemKey(state.itemId);
        if (parsed.source === 'base_items') {
          const def = baseItemById.get(parsed.id);
          if (!def) continue;
          display.push({ ...def, key: instanceId, navigable: true });
        } else {
          const def = generalItemById.get(parsed.id);
          if (!def) continue;
          const quantity = def.category === 'consumable' ? (itemsQuantityById.get(def.id) ?? 1) : 1;
          display.push({
            key: instanceId,
            navigable: true,
            id: def.id,
            category: def.category,
            name: def.name,
            weight: formatWeightKg(def.name, def.weightLb, quantity),
            weightKg: getWeightKg(def.name, def.weightLb),
          });
        }
      }
      setItems(display);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [db, inventoryEntries, breathWeaponStats]);

  const sections = useMemo(
    () =>
      INVENTORY_CATEGORY_SECTIONS.map((section) => ({
        ...section,
        items: sortByLocalizedName(items.filter((item) => item.category === section.category)),
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
                if (section.category === 'weapon' || section.category === 'armor') {
                  const isWeapon = section.category === 'weapon';
                  const isLocked = character.inventoryItems[item.key]?.locked ?? false;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() =>
                        router.push({ pathname: '/sheet/[characterId]/item/[id]', params: { characterId: character.id, id: item.key } })
                      }
                    >
                      <EquipmentItemCard
                        name={item.name}
                        properties={item.properties}
                        weight={item.weight}
                        statValue={isWeapon ? item.damageDice : item.armorClassBonus}
                        statIcon={isWeapon ? 'sword' : 'shield'}
                        equipped={
                          isLocked
                            ? true
                            : isWeapon
                              ? character.inventoryItems[item.key]?.weaponSlot != null
                              : character.inventoryItems[item.key]?.armorSlot != null
                        }
                        onToggleEquipped={() => {
                          // Granted by a racial/class feature - can't be
                          // unequipped through the normal UI (see
                          // InventoryItemState.locked).
                          if (isLocked) return;
                          if (isWeapon) {
                            const outcome = toggleWeaponEquipped(item.key, item.handedness ?? 'oneHanded');
                            if (outcome.kind === 'blocked') setBlockedMessage(outcome.message);
                            else if (outcome.kind === 'confirmShieldUnequip') {
                              setShieldConfirm({ id: item.key, slot: outcome.slot });
                            }
                            return;
                          }
                          const wasEquipped = character.inventoryItems[item.key]?.armorSlot != null;
                          const message = toggleArmorEquipped(item.key, item.armorSlotKind ?? 'body');
                          if (message) {
                            setBlockedMessage(message);
                            return;
                          }
                          if (
                            !wasEquipped &&
                            item.strengthRequirement != null &&
                            (getAbilityTotal(character.abilities.str) ?? 0) < item.strengthRequirement
                          ) {
                            setBlockedMessage(
                              `Você não atende ao requisito de Força mínima desta armadura (${item.strengthRequirement}). Seu deslocamento é reduzido em ${feetToMeters(ARMOR_STRENGTH_SPEED_PENALTY_FEET)}m / ${feetToSquares(ARMOR_STRENGTH_SPEED_PENALTY_FEET)}q.`
                            );
                          }
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
