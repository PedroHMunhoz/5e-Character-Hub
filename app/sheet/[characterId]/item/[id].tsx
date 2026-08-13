import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { CheckboxToggle } from '@/components/character/checkbox-toggle';
import { ConfirmModal } from '@/components/character/confirm-modal';
import { ItemIconPlaceholder } from '@/components/character/item-icon-placeholder';
import { MessageModal } from '@/components/character/message-modal';
import { PropertyPill } from '@/components/character/property-pill';
import { SelectField, type SelectFieldOption } from '@/components/character/select-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WEAPON_PROPERTY_LABELS, type WeaponHandedness } from '@/constants/item-codes';
import { getItemPropertyDescriptions, type ItemPropertyDetail } from '@/data/queries/item-properties';
import { getBaseItemDetailById, type ItemDetail } from '@/data/queries/item-detail';
import { formatAbilityTotal, formatSignedModifier } from '@/utils/ability-modifier';
import { useCharacter } from '@/hooks/use-character';
import { useCharacterClassInfo } from '@/hooks/use-character-class-info';
import { useEquippedArmor } from '@/hooks/use-equipped-armor';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getCharacterLevel, getProficiencyBonus } from '@/utils/proficiency';
import { isMonkWeapon } from '@/utils/monk-weapons';
import { formatSpacedModifier, getWeaponAbilityModifier, type WeaponAttackAbility } from '@/utils/weapon-combat';
import type { WeaponSlot } from '@/types/character';

type WeaponSlotValue = WeaponSlot | 'none';

const GRID_GAP = 12;
const HEADER_GAP = 12;
const HEADER_ICON_RATIO = 0.3;

function getSlotOptions(handedness: WeaponHandedness): SelectFieldOption<WeaponSlotValue>[] {
  const none: SelectFieldOption<WeaponSlotValue> = { value: 'none', label: 'Não Equipado' };
  const main: SelectFieldOption<WeaponSlotValue> = { value: 'main', label: 'Mão Principal' };
  const off: SelectFieldOption<WeaponSlotValue> = { value: 'off', label: 'Mão Secundária' };
  const twoHanded: SelectFieldOption<WeaponSlotValue> = { value: 'twoHanded', label: 'Duas Mãos' };

  if (handedness === 'twoHanded') return [none, twoHanded];
  if (handedness === 'versatile') return [none, main, off, twoHanded];
  return [none, main, off];
}

// Two cells of exactly equal, measured width - not `flex`/`%`, both of which
// proved unreliable at splitting a row evenly on this app's native Yoga
// runtime across several rounds of testing on a real device.
function GridRow({ left, right }: { left: ReactNode; right: ReactNode }) {
  const [width, setWidth] = useState(0);
  const cellWidth = width > 0 ? (width - GRID_GAP) / 2 : undefined;

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <View style={styles.gridRow} onLayout={handleLayout}>
      <View style={cellWidth != null ? { width: cellWidth } : styles.gridCellFallback}>{left}</View>
      <View style={{ width: GRID_GAP }} />
      <View style={cellWidth != null ? { width: cellWidth } : styles.gridCellFallback}>{right}</View>
    </View>
  );
}

// Same measured-width approach as GridRow, but split at a fixed ratio
// (photo/fields) instead of 50/50, so the photo is always the same relative
// size regardless of how long the Categoria text happens to be.
function HeaderRow({ icon, fields }: { icon: ReactNode; fields: ReactNode }) {
  const [width, setWidth] = useState(0);
  const iconWidth = width > 0 ? Math.round((width - HEADER_GAP) * HEADER_ICON_RATIO) : undefined;
  const fieldsWidth = width > 0 && iconWidth != null ? width - HEADER_GAP - iconWidth : undefined;

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <View style={styles.headerRow} onLayout={handleLayout}>
      <View style={iconWidth != null ? { width: iconWidth } : styles.gridCellFallback}>{icon}</View>
      <View style={{ width: HEADER_GAP }} />
      <View style={fieldsWidth != null ? { width: fieldsWidth } : styles.headerFieldsFallback}>{fields}</View>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const goldColor = useThemeColor({}, 'gold');
  return (
    <View style={[styles.field, { borderColor: goldColor }]}>
      <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      <ThemedText style={styles.fieldValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {value}
      </ThemedText>
    </View>
  );
}

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { character, setItemQuantity, toggleArmorEquipped, setWeaponSlot, hasEquippedShield } = useCharacter();
  const { englishName: classEnglishName } = useCharacterClassInfo();
  const equippedArmor = useEquippedArmor();
  const goldColor = useThemeColor({}, 'gold');

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [propertyDetails, setPropertyDetails] = useState<Map<string, ItemPropertyDetail>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedPropertyCode, setSelectedPropertyCode] = useState<string | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [pendingSlot, setPendingSlot] = useState<WeaponSlotValue | null>(null);

  const ownedQuantity = character.inventoryItems[id]?.quantity ?? '1';

  useEffect(() => {
    const numericId = Number(id);
    let cancelled = false;

    async function load() {
      const detail = await getBaseItemDetailById(db, numericId, Number(ownedQuantity) || 1);
      if (cancelled) return;
      setItem(detail);

      if (detail?.category === 'weapon' && detail.propertyCodes.length > 0) {
        const descriptions = await getItemPropertyDescriptions(db, detail.propertyCodes);
        if (!cancelled) setPropertyDetails(descriptions);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [db, id, ownedQuantity]);

  if (loading || !item) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={goldColor} />
      </View>
    );
  }

  const itemId = String(item.id);
  const inventoryState = character.inventoryItems[itemId];
  const selectedProperty = selectedPropertyCode ? propertyDetails.get(selectedPropertyCode) : undefined;
  const selectedPropertyRangeDetail =
    item.category === 'weapon' && (selectedPropertyCode === 'A' || selectedPropertyCode === 'T')
      ? item.rangeDetail
      : undefined;
  const selectedPropertyMessage = selectedProperty
    ? [selectedProperty.description, selectedPropertyRangeDetail].filter(Boolean).join('\n\n')
    : undefined;

  const otherWeaponSlots = Object.entries(character.inventoryItems)
    .filter(([key, state]) => key !== itemId && state.weaponSlot != null)
    .map(([, state]) => state.weaponSlot as WeaponSlot);
  const hasAnyOtherWeapon = otherWeaponSlots.length > 0;
  const hasMainHandCompanion = otherWeaponSlots.includes('main');
  const useMonkDex =
    classEnglishName === 'Monk' &&
    equippedArmor.length === 0 &&
    item.category === 'weapon' &&
    isMonkWeapon(item);

  return (
    <>
      <Stack.Screen options={{ title: item.name }} />
      <ThemedView style={styles.container}>
        <HeaderRow
          icon={<ItemIconPlaceholder fill />}
          fields={
            <View style={styles.headerFields}>
              <Field label="Peso" value={`${item.weight} kg`} />
              <Field label="Categoria" value={item.categoryLabel} />
            </View>
          }
        />

        {item.category === 'weapon' ? (
          <WeaponSection
            item={item}
            slot={inventoryState?.weaponSlot ?? 'none'}
            onSlotChange={(slot) => {
              if ((slot === 'off' || slot === 'twoHanded') && hasEquippedShield(itemId)) {
                setPendingSlot(slot);
                return;
              }
              setWeaponSlot(itemId, slot);
            }}
            strScore={formatAbilityTotal(character.abilities.str)}
            dexScore={formatAbilityTotal(character.abilities.dex)}
            proficiencyBonus={getProficiencyBonus(getCharacterLevel(character.classes)) ?? 0}
            fightingStyle={character.fightingStyle ?? null}
            hasAnyOtherWeapon={hasAnyOtherWeapon}
            hasMainHandCompanion={hasMainHandCompanion}
            useMonkDex={useMonkDex}
            onPropertyPress={setSelectedPropertyCode}
          />
        ) : null}

        {item.category === 'armor' ? (
          <>
            <GridRow
              left={<Field label="CA" value={formatSignedModifier(item.armorClassBonus)} />}
              right={
                <View style={[styles.field, styles.equippedField, { borderColor: goldColor }]}>
                  <ThemedText style={styles.fieldLabel}>Equipado</ThemedText>
                  <CheckboxToggle
                    checked={inventoryState?.armorSlot != null}
                    onToggle={() => {
                      const message = toggleArmorEquipped(itemId, item.armorSlotKind);
                      if (message) setBlockedMessage(message);
                    }}
                  />
                </View>
              }
            />

            {item.strengthRequirement || item.stealthDisadvantage ? (
              <View style={[styles.field, styles.observationsField, { borderColor: goldColor }]}>
                <ThemedText style={styles.fieldLabel}>Observações</ThemedText>
                {item.strengthRequirement ? (
                  <ThemedText
                    style={styles.bulletItem}
                  >{`•  Requer Força mínima de ${item.strengthRequirement}`}</ThemedText>
                ) : null}
                {item.stealthDisadvantage ? (
                  <ThemedText style={styles.bulletItem}>{'•  Desvantagem em Furtividade'}</ThemedText>
                ) : null}
              </View>
            ) : null}
          </>
        ) : null}

        {item.category === 'consumable' ? (
          <ConsumableSection
            quantity={inventoryState?.quantity ?? item.defaultQuantity}
            onQuantityChange={(value) => setItemQuantity(itemId, value)}
          />
        ) : null}
      </ThemedView>

      <MessageModal
        visible={selectedPropertyCode != null}
        title={selectedProperty?.name}
        message={selectedPropertyMessage}
        onClose={() => setSelectedPropertyCode(null)}
      />

      <MessageModal
        visible={blockedMessage != null}
        title="Atenção"
        message={blockedMessage ?? undefined}
        onClose={() => setBlockedMessage(null)}
      />

      <ConfirmModal
        visible={pendingSlot != null}
        title="Atenção"
        message="Equipar esta arma vai desequipar o escudo atual. Deseja continuar?"
        onCancel={() => setPendingSlot(null)}
        onConfirm={() => {
          if (pendingSlot) setWeaponSlot(itemId, pendingSlot);
          setPendingSlot(null);
        }}
      />
    </>
  );
}

interface WeaponSectionProps {
  item: Extract<ItemDetail, { category: 'weapon' }>;
  slot: WeaponSlotValue;
  onSlotChange: (slot: WeaponSlotValue) => void;
  strScore: string;
  dexScore: string;
  proficiencyBonus: number;
  fightingStyle: string | null;
  hasAnyOtherWeapon: boolean;
  hasMainHandCompanion: boolean;
  useMonkDex: boolean;
  onPropertyPress: (code: string) => void;
}

function WeaponSection({
  item,
  slot,
  onSlotChange,
  strScore,
  dexScore,
  proficiencyBonus,
  fightingStyle,
  hasAnyOtherWeapon,
  hasMainHandCompanion,
  useMonkDex,
  onPropertyPress,
}: WeaponSectionProps) {
  const goldColor = useThemeColor({}, 'gold');
  // Martial Arts (Monk) lets DEX stand in for STR on unarmed/monk-weapon
  // attacks even without the Finesse property - 'finesse' already picks
  // whichever of STR/DEX is higher, matching the rule's "your choice" text.
  const attackAbility: WeaponAttackAbility = useMonkDex ? 'finesse' : item.attackAbility;
  const abilityMod = getWeaponAbilityModifier(attackAbility, strScore, dexScore);
  const isTwoHanded = slot === 'twoHanded';

  // Fighting Style's "Archery": +2 to attack rolls with ranged weapons.
  const archeryBonus = fightingStyle === 'Archery' && item.isRanged ? 2 : 0;
  const attackBonus = abilityMod + proficiencyBonus + archeryBonus;

  // RAW: the off-hand (bonus action) attack only adds the ability modifier
  // to damage if it's negative, unless the character has Two-Weapon
  // Fighting - only relevant when there's actually a companion weapon in
  // the main hand (otherwise this weapon isn't really "off-hand", it's just
  // the only one equipped).
  const isOffHandAttack = slot === 'off' && hasMainHandCompanion;
  const baseDamageMod = isOffHandAttack
    ? fightingStyle === 'Two-Weapon Fighting'
      ? abilityMod
      : Math.min(abilityMod, 0)
    : abilityMod;
  // Fighting Style's "Dueling": +2 damage with a one-handed melee weapon
  // and no other weapon equipped.
  const duelingBonus =
    fightingStyle === 'Dueling' && !item.isRanged && !isTwoHanded && !hasAnyOtherWeapon ? 2 : 0;
  const damageMod = baseDamageMod + duelingBonus;

  const damageDice = isTwoHanded && item.damageDiceVersatile ? item.damageDiceVersatile : item.damageDice;
  const damageTypeLabel = item.damageTypeLabel ?? '—';

  return (
    <>
      <GridRow
        left={
          <SelectField
            label="Equipado Em"
            value={slot}
            options={getSlotOptions(item.handedness)}
            onChange={onSlotChange}
          />
        }
        right={<Field label="Acerto" value={`1d20 ${formatSpacedModifier(attackBonus)}`} />}
      />

      <GridRow
        left={<Field label="Dano" value={`${damageDice} ${formatSpacedModifier(damageMod)}`} />}
        right={<Field label="Tipo de Dano" value={damageTypeLabel} />}
      />

      {item.propertyCodes.length > 0 ? (
        <View style={[styles.field, styles.propertiesField, { borderColor: goldColor }]}>
          <ThemedText style={styles.fieldLabel}>Propriedades</ThemedText>
          <View style={styles.propertiesRow}>
            {item.propertyCodes.map((code) => {
              const baseLabel = WEAPON_PROPERTY_LABELS[code] ?? code;
              const label =
                (code === 'A' || code === 'T') && item.range ? `${baseLabel} (${item.range})` : baseLabel;
              return <PropertyPill key={code} label={label} onPress={() => onPropertyPress(code)} />;
            })}
          </View>
        </View>
      ) : null}
    </>
  );
}

interface ConsumableSectionProps {
  quantity: string;
  onQuantityChange: (value: string) => void;
}

function ConsumableSection({ quantity, onQuantityChange }: ConsumableSectionProps) {
  const goldColor = useThemeColor({}, 'gold');
  const current = parseInt(quantity, 10) || 0;

  function adjust(delta: number) {
    onQuantityChange(String(Math.max(0, current + delta)));
  }

  return (
    <View style={[styles.field, styles.quantityField, { borderColor: goldColor }]}>
      <ThemedText style={styles.fieldLabel}>Quantidade</ThemedText>
      <View style={styles.quantityStepper}>
        <Pressable onPress={() => adjust(-1)} style={[styles.stepperButton, { borderColor: goldColor }]}>
          <ThemedText style={[styles.stepperButtonText, { color: goldColor }]}>−</ThemedText>
        </Pressable>
        <ThemedText style={styles.fieldValue}>{current}</ThemedText>
        <Pressable onPress={() => adjust(1)} style={[styles.stepperButton, { borderColor: goldColor }]}>
          <ThemedText style={[styles.stepperButtonText, { color: goldColor }]}>+</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    padding: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    width: '100%',
  },
  headerFields: {
    gap: 8,
  },
  headerFieldsFallback: {
    flex: 3,
  },
  gridRow: {
    flexDirection: 'row',
    width: '100%',
  },
  gridCellFallback: {
    flex: 1,
  },
  field: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  equippedField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityField: {
    width: '50%',
    gap: 8,
  },
  observationsField: {
    gap: 6,
  },
  propertiesField: {
    gap: 8,
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  stepperButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  bulletItem: {
    fontSize: 14,
    opacity: 0.85,
  },
  propertiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
