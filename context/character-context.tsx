import { createContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ABILITIES, SKILLS } from '@/constants/character';
import { useCharacterDb } from '@/context/character-db-context';
import { getCharacterById, saveCharacter } from '@/data/queries/player-characters';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { WeaponHandedness } from '@/constants/item-codes';
import type {
  AbilityKey,
  ArmorSlot,
  Biography,
  CharacterClass,
  CharacterSheet,
  Currency,
  DeathSaves,
  HitDice,
  HitPoints,
  SkillKey,
  WeaponSlot,
} from '@/types/character';

export type WeaponEquipOutcome =
  { kind: 'applied' } | { kind: 'blocked'; message: string } | { kind: 'confirmShieldUnequip'; slot: WeaponSlot };

function createClassId() {
  return `class-${Math.random().toString(36).slice(2, 10)}`;
}

// Placeholder reducer state before the real character (loaded by id from
// characters.db - see CharacterProvider below) arrives. Never rendered to
// the player: CharacterProvider withholds `children` until the LOAD action
// has fired, so this only exists to give useReducer a valid initial value.
const initialCharacter: CharacterSheet = {
  id: 'demo',
  name: '',
  race: '',
  classes: [{ id: createClassId(), name: '', level: '' }],
  inspiration: false,
  abilities: Object.fromEntries(
    ABILITIES.map((ability) => [ability.key, { base: '', racialBonus: 0 }])
  ) as CharacterSheet['abilities'],
  savingThrows: Object.fromEntries(
    ABILITIES.map((ability) => [ability.key, { proficient: false }])
  ) as CharacterSheet['savingThrows'],
  skills: Object.fromEntries(
    SKILLS.map((skill) => [skill.key, { proficient: false, expertise: false }])
  ) as CharacterSheet['skills'],
  speed: '9',
  hitPoints: { max: '100', current: '87', temporary: '100' },
  hitDice: { current: '3', max: '6' },
  exhaustion: 0,
  deathSaves: { successes: 0, failures: 0 },
  currency: { pl: '', po: '', pp: '', pe: '', pc: '' },
  inventoryItems: {},
  tools: {},
  features: {},
  spells: {},
  spellSlotsUsed: {},
  biography: {
    alignment: '',
    eyes: '',
    height: '',
    faith: '',
    hair: '',
    weight: '',
    gender: '',
    skin: '',
    age: '',
    ideals: '',
    personalityTraits: '',
    bonds: '',
    flaws: '',
    notes: '',
  },
};

type Action =
  | { type: 'LOAD'; character: CharacterSheet }
  | { type: 'SET_NAME'; value: string }
  | { type: 'SET_RACE'; value: string }
  | { type: 'ADD_CLASS' }
  | { type: 'REMOVE_CLASS'; id: string }
  | { type: 'SET_CLASS_NAME'; id: string; value: string }
  | { type: 'SET_CLASS_LEVEL'; id: string; value: string }
  | { type: 'TOGGLE_INSPIRATION' }
  | { type: 'SET_ABILITY_SCORE'; key: AbilityKey; value: string }
  | { type: 'TOGGLE_SAVING_THROW'; key: AbilityKey }
  | { type: 'SET_SKILL_PROFICIENCY'; key: SkillKey; proficient: boolean; expertise: boolean }
  | { type: 'TOGGLE_TOOL_PROFICIENCY'; id: string }
  | { type: 'SET_SPEED'; value: string }
  | { type: 'SET_HP_FIELD'; field: keyof HitPoints; value: string }
  | { type: 'SET_HIT_DICE_FIELD'; field: keyof HitDice; value: string }
  | { type: 'SET_EXHAUSTION'; value: number }
  | { type: 'SET_DEATH_SAVES'; field: keyof DeathSaves; value: number }
  | { type: 'SET_CURRENCY_FIELD'; field: keyof Currency; value: string }
  | { type: 'SET_ITEM_QUANTITY'; id: string; value: string }
  | { type: 'SET_WEAPON_SLOT'; id: string; slot: WeaponSlot | 'none' }
  | { type: 'SET_ARMOR_SLOT'; id: string; slot: ArmorSlot | 'none' }
  | { type: 'SET_FEATURE_USES'; id: string; value: string }
  | { type: 'TOGGLE_SPELL_PREPARED'; id: string }
  | { type: 'SET_SPELL_SLOT_USED'; level: string; value: number }
  | { type: 'SET_BIOGRAPHY_FIELD'; field: keyof Biography; value: string };

// Two weapon slots conflict (only one weapon can occupy them at once) when
// they're the same slot, or either one is 'twoHanded' - a two-handed grip
// occupies both the main and off hand.
function weaponSlotsConflict(existingSlot: WeaponSlot | undefined, newSlot: WeaponSlot): boolean {
  if (!existingSlot) return false;
  return existingSlot === newSlot || existingSlot === 'twoHanded' || newSlot === 'twoHanded';
}

// A two-handed weapon occupies both hands, so it counts as occupying
// whichever single hand is being checked.
function isHandOccupied(
  inventoryItems: CharacterSheet['inventoryItems'],
  hand: 'main' | 'off',
  excludeId?: string
): boolean {
  return Object.entries(inventoryItems).some(
    ([itemId, itemState]) =>
      itemId !== excludeId && (itemState.weaponSlot === hand || itemState.weaponSlot === 'twoHanded')
  );
}

function findEquippedShieldId(
  inventoryItems: CharacterSheet['inventoryItems'],
  excludeId?: string
): string | undefined {
  const entry = Object.entries(inventoryItems).find(
    ([itemId, itemState]) => itemId !== excludeId && itemState.armorSlot === 'shield'
  );
  return entry?.[0];
}

function characterReducer(state: CharacterSheet, action: Action): CharacterSheet {
  switch (action.type) {
    case 'LOAD':
      return action.character;
    case 'SET_NAME':
      return { ...state, name: action.value };
    case 'SET_RACE':
      return { ...state, race: action.value };
    case 'ADD_CLASS':
      return {
        ...state,
        classes: [...state.classes, { id: createClassId(), name: '', level: '' }],
      };
    case 'REMOVE_CLASS':
      return {
        ...state,
        classes: state.classes.filter((characterClass) => characterClass.id !== action.id),
      };
    case 'SET_CLASS_NAME':
      return {
        ...state,
        classes: state.classes.map((characterClass) =>
          characterClass.id === action.id ? { ...characterClass, name: action.value } : characterClass
        ),
      };
    case 'SET_CLASS_LEVEL':
      return {
        ...state,
        classes: state.classes.map((characterClass) =>
          characterClass.id === action.id ? { ...characterClass, level: action.value } : characterClass
        ),
      };
    case 'TOGGLE_INSPIRATION':
      return { ...state, inspiration: !state.inspiration };
    case 'SET_ABILITY_SCORE':
      return {
        ...state,
        abilities: {
          ...state.abilities,
          [action.key]: { ...state.abilities[action.key], base: action.value },
        },
      };
    case 'TOGGLE_SAVING_THROW':
      return {
        ...state,
        savingThrows: {
          ...state.savingThrows,
          [action.key]: {
            ...state.savingThrows[action.key],
            proficient: !state.savingThrows[action.key].proficient,
          },
        },
      };
    case 'SET_SKILL_PROFICIENCY':
      return {
        ...state,
        skills: {
          ...state.skills,
          [action.key]: { proficient: action.proficient, expertise: action.expertise },
        },
      };
    case 'TOGGLE_TOOL_PROFICIENCY':
      return {
        ...state,
        tools: {
          ...state.tools,
          [action.id]: {
            proficient: !(state.tools[action.id]?.proficient ?? false),
            expertise: state.tools[action.id]?.expertise ?? false,
          },
        },
      };
    case 'SET_SPEED':
      return { ...state, speed: action.value };
    case 'SET_HP_FIELD':
      return {
        ...state,
        hitPoints: { ...state.hitPoints, [action.field]: action.value },
      };
    case 'SET_HIT_DICE_FIELD':
      return {
        ...state,
        hitDice: { ...state.hitDice, [action.field]: action.value },
      };
    case 'SET_EXHAUSTION':
      return { ...state, exhaustion: action.value };
    case 'SET_DEATH_SAVES':
      return {
        ...state,
        deathSaves: { ...state.deathSaves, [action.field]: action.value },
      };
    case 'SET_CURRENCY_FIELD':
      return {
        ...state,
        currency: { ...state.currency, [action.field]: action.value },
      };
    case 'SET_ITEM_QUANTITY':
      return {
        ...state,
        inventoryItems: {
          ...state.inventoryItems,
          [action.id]: {
            ...(state.inventoryItems[action.id] ?? { quantity: '1' }),
            quantity: action.value,
          },
        },
      };
    case 'SET_WEAPON_SLOT': {
      const { id, slot } = action;
      const inventoryItems = { ...state.inventoryItems };

      if (slot !== 'none') {
        for (const [itemId, itemState] of Object.entries(inventoryItems)) {
          if (itemId !== id && weaponSlotsConflict(itemState.weaponSlot, slot)) {
            inventoryItems[itemId] = { ...itemState, weaponSlot: undefined };
          }
        }
      }

      const current = inventoryItems[id];
      inventoryItems[id] = {
        ...(current ?? { quantity: '1' }),
        weaponSlot: slot === 'none' ? undefined : slot,
      };

      return { ...state, inventoryItems };
    }
    case 'SET_ARMOR_SLOT': {
      const { id, slot } = action;
      const inventoryItems = { ...state.inventoryItems };

      if (slot !== 'none') {
        for (const [itemId, itemState] of Object.entries(inventoryItems)) {
          if (itemId !== id && itemState.armorSlot === slot) {
            inventoryItems[itemId] = { ...itemState, armorSlot: undefined };
          }
        }
      }

      const current = inventoryItems[id];
      inventoryItems[id] = {
        ...(current ?? { quantity: '1' }),
        armorSlot: slot === 'none' ? undefined : slot,
      };

      return { ...state, inventoryItems };
    }
    case 'SET_FEATURE_USES':
      return {
        ...state,
        features: {
          ...state.features,
          [action.id]: { usesCurrent: action.value },
        },
      };
    case 'TOGGLE_SPELL_PREPARED':
      return {
        ...state,
        spells: {
          ...state.spells,
          [action.id]: { prepared: !(state.spells[action.id]?.prepared ?? false) },
        },
      };
    case 'SET_SPELL_SLOT_USED':
      return {
        ...state,
        spellSlotsUsed: {
          ...state.spellSlotsUsed,
          [action.level]: action.value,
        },
      };
    case 'SET_BIOGRAPHY_FIELD':
      return {
        ...state,
        biography: { ...state.biography, [action.field]: action.value },
      };
    default:
      return state;
  }
}

export interface CharacterContextValue {
  character: CharacterSheet;
  setName: (value: string) => void;
  setRace: (value: string) => void;
  addClass: () => void;
  removeClass: (id: string) => void;
  setClassName: (id: string, value: string) => void;
  setClassLevel: (id: string, value: string) => void;
  toggleInspiration: () => void;
  setAbilityScore: (key: AbilityKey, value: string) => void;
  toggleSavingThrowProficiency: (key: AbilityKey) => void;
  setSkillProficiency: (key: SkillKey, proficient: boolean, expertise: boolean) => void;
  toggleToolProficiency: (id: string) => void;
  setSpeed: (value: string) => void;
  setHitPointsField: (field: keyof HitPoints, value: string) => void;
  setHitDiceField: (field: keyof HitDice, value: string) => void;
  setExhaustion: (value: number) => void;
  setDeathSaves: (field: keyof DeathSaves, value: number) => void;
  setCurrencyField: (field: keyof Currency, value: string) => void;
  setItemQuantity: (id: string, value: string) => void;
  setWeaponSlot: (id: string, slot: WeaponSlot | 'none') => void;
  toggleWeaponEquipped: (id: string, handedness: WeaponHandedness) => WeaponEquipOutcome;
  toggleArmorEquipped: (id: string, slotKind: ArmorSlot) => string | null;
  hasEquippedShield: (excludeId?: string) => boolean;
  setFeatureUses: (id: string, value: string) => void;
  toggleSpellPrepared: (id: string) => void;
  setSpellSlotUsed: (level: string, value: number) => void;
  setBiographyField: (field: keyof Biography, value: string) => void;
}

export const CharacterContext = createContext<CharacterContextValue | undefined>(undefined);

export function CharacterProvider({ characterId, children }: { characterId: string; children: ReactNode }) {
  const charactersDb = useCharacterDb();
  const [character, dispatch] = useReducer(characterReducer, initialCharacter);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const goldColor = useThemeColor({}, 'gold');

  useEffect(() => {
    let cancelled = false;
    setHasLoaded(false);
    setLoadError(null);
    getCharacterById(charactersDb, characterId)
      .then((loaded) => {
        if (cancelled) return;
        if (!loaded) {
          // Surfaced below rather than left silent - previously this just
          // left the screen blank forever with no indication anything had
          // gone wrong.
          setLoadError(`Personagem "${characterId}" não encontrado.`);
          return;
        }
        dispatch({ type: 'LOAD', character: loaded });
        setHasLoaded(true);
      })
      .catch((err: Error) => {
        console.error('[CharacterProvider] failed to load character', err);
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [charactersDb, characterId]);

  // Debounced autosave: the reducer already treats every field as live-
  // edited (no draft/commit distinction anywhere in the sheet), so writing
  // shortly after the player stops interacting - rather than on every
  // keystroke, or requiring an explicit "Salvar" button - matches that
  // existing behavior. Gated on hasLoaded so the placeholder
  // initialCharacter can never overwrite the just-loaded row before LOAD
  // lands.
  useEffect(() => {
    if (!hasLoaded) return;
    const handle = setTimeout(() => {
      saveCharacter(charactersDb, character);
    }, 600);
    return () => clearTimeout(handle);
  }, [character, hasLoaded, charactersDb]);

  const value = useMemo<CharacterContextValue>(
    () => ({
      character,
      setName: (value) => dispatch({ type: 'SET_NAME', value }),
      setRace: (value) => dispatch({ type: 'SET_RACE', value }),
      addClass: () => dispatch({ type: 'ADD_CLASS' }),
      removeClass: (id) => dispatch({ type: 'REMOVE_CLASS', id }),
      setClassName: (id, value) => dispatch({ type: 'SET_CLASS_NAME', id, value }),
      setClassLevel: (id, value) => dispatch({ type: 'SET_CLASS_LEVEL', id, value }),
      toggleInspiration: () => dispatch({ type: 'TOGGLE_INSPIRATION' }),
      setAbilityScore: (key, value) => dispatch({ type: 'SET_ABILITY_SCORE', key, value }),
      toggleSavingThrowProficiency: (key) => dispatch({ type: 'TOGGLE_SAVING_THROW', key }),
      setSkillProficiency: (key, proficient, expertise) =>
        dispatch({ type: 'SET_SKILL_PROFICIENCY', key, proficient, expertise }),
      toggleToolProficiency: (id) => dispatch({ type: 'TOGGLE_TOOL_PROFICIENCY', id }),
      setSpeed: (value) => dispatch({ type: 'SET_SPEED', value }),
      setHitPointsField: (field, value) => dispatch({ type: 'SET_HP_FIELD', field, value }),
      setHitDiceField: (field, value) => dispatch({ type: 'SET_HIT_DICE_FIELD', field, value }),
      setExhaustion: (value) => dispatch({ type: 'SET_EXHAUSTION', value }),
      setDeathSaves: (field, value) => dispatch({ type: 'SET_DEATH_SAVES', field, value }),
      setCurrencyField: (field, value) => dispatch({ type: 'SET_CURRENCY_FIELD', field, value }),
      setItemQuantity: (id, value) => dispatch({ type: 'SET_ITEM_QUANTITY', id, value }),
      setWeaponSlot: (id, slot) => {
        // Occupying the off hand (directly or via a two-handed grip) leaves
        // no free hand for a shield, so drop it rather than allow both.
        if (slot === 'off' || slot === 'twoHanded') {
          const shieldId = findEquippedShieldId(character.inventoryItems, id);
          if (shieldId) dispatch({ type: 'SET_ARMOR_SLOT', id: shieldId, slot: 'none' });
        }
        dispatch({ type: 'SET_WEAPON_SLOT', id, slot });
      },
      toggleWeaponEquipped: (id, handedness) => {
        if (character.inventoryItems[id]?.weaponSlot) {
          dispatch({ type: 'SET_WEAPON_SLOT', id, slot: 'none' });
          return { kind: 'applied' };
        }

        const mainOccupied = isHandOccupied(character.inventoryItems, 'main', id);
        const offOccupied = isHandOccupied(character.inventoryItems, 'off', id);

        if (handedness === 'twoHanded') {
          if (mainOccupied || offOccupied) {
            return { kind: 'blocked', message: 'Desequipe uma arma antes de equipar esta arma de duas mãos.' };
          }
          if (findEquippedShieldId(character.inventoryItems, id)) {
            return { kind: 'confirmShieldUnequip', slot: 'twoHanded' };
          }
          dispatch({ type: 'SET_WEAPON_SLOT', id, slot: 'twoHanded' });
          return { kind: 'applied' };
        }

        if (!mainOccupied) {
          dispatch({ type: 'SET_WEAPON_SLOT', id, slot: 'main' });
          return { kind: 'applied' };
        }
        if (!offOccupied) {
          if (findEquippedShieldId(character.inventoryItems, id)) {
            return { kind: 'confirmShieldUnequip', slot: 'off' };
          }
          dispatch({ type: 'SET_WEAPON_SLOT', id, slot: 'off' });
          return { kind: 'applied' };
        }
        return { kind: 'blocked', message: 'Desequipe uma arma antes de equipar esta.' };
      },
      toggleArmorEquipped: (id, slotKind) => {
        if (character.inventoryItems[id]?.armorSlot) {
          dispatch({ type: 'SET_ARMOR_SLOT', id, slot: 'none' });
          return null;
        }

        const occupiedByOther = Object.entries(character.inventoryItems).some(
          ([itemId, itemState]) => itemId !== id && itemState.armorSlot === slotKind
        );
        if (occupiedByOther) {
          return slotKind === 'shield'
            ? 'Desequipe o escudo atual antes de equipar este.'
            : 'Desequipe a armadura atual antes de equipar esta.';
        }

        if (slotKind === 'shield' && isHandOccupied(character.inventoryItems, 'off', id)) {
          // A one-handed weapon in the off hand can simply move to the main
          // hand to make room, sparing the player a manual re-equip - but
          // only if the main hand is actually free to receive it.
          const offHandWeapon = Object.entries(character.inventoryItems).find(
            ([itemId, itemState]) => itemId !== id && itemState.weaponSlot === 'off'
          );
          const mainHandFree = !isHandOccupied(character.inventoryItems, 'main', id);

          if (offHandWeapon && mainHandFree) {
            dispatch({ type: 'SET_WEAPON_SLOT', id: offHandWeapon[0], slot: 'main' });
          } else {
            return 'Sua mão secundária precisa estar livre para equipar um escudo.';
          }
        }

        dispatch({ type: 'SET_ARMOR_SLOT', id, slot: slotKind });
        return null;
      },
      hasEquippedShield: (excludeId) => findEquippedShieldId(character.inventoryItems, excludeId) != null,
      setFeatureUses: (id, value) => dispatch({ type: 'SET_FEATURE_USES', id, value }),
      toggleSpellPrepared: (id) => dispatch({ type: 'TOGGLE_SPELL_PREPARED', id }),
      setSpellSlotUsed: (level, value) => dispatch({ type: 'SET_SPELL_SLOT_USED', level, value }),
      setBiographyField: (field, value) => dispatch({ type: 'SET_BIOGRAPHY_FIELD', field, value }),
    }),
    [character]
  );

  if (loadError) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={styles.errorTitle}>Não foi possível carregar o personagem.</ThemedText>
        <ThemedText style={styles.errorMessage}>{loadError}</ThemedText>
      </ThemedView>
    );
  }

  if (!hasLoaded) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={goldColor} />
        <ThemedText style={styles.loadingText}>Carregando seu personagem, aguarde...</ThemedText>
      </ThemedView>
    );
  }

  return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 13,
    opacity: 0.7,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
});
