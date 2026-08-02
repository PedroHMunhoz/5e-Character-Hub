import { createContext, useMemo, useReducer, type ReactNode } from 'react';

import { ABILITIES, SKILLS } from '@/constants/character';
import type {
  AbilityKey,
  Biography,
  CharacterClass,
  CharacterSheet,
  Currency,
  DeathSaves,
  HitDice,
  HitPoints,
  SkillKey,
} from '@/types/character';

function createClassId() {
  return `class-${Math.random().toString(36).slice(2, 10)}`;
}

const initialCharacter: CharacterSheet = {
  name: '',
  race: '',
  classes: [{ id: createClassId(), name: '', level: '' }],
  inspiration: false,
  abilities: Object.fromEntries(
    ABILITIES.map((ability) => [ability.key, { score: '' }])
  ) as CharacterSheet['abilities'],
  savingThrows: Object.fromEntries(
    ABILITIES.map((ability) => [ability.key, { proficient: false }])
  ) as CharacterSheet['savingThrows'],
  skills: Object.fromEntries(
    SKILLS.map((skill) => [skill.key, { proficient: false }])
  ) as CharacterSheet['skills'],
  speed: '',
  hitPoints: { max: '', current: '', temporary: '' },
  hitDice: { current: '', max: '' },
  exhaustion: 0,
  deathSaves: { successes: 0, failures: 0 },
  currency: { pl: '', po: '', pp: '', pe: '', pc: '' },
  inventoryItems: {},
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
  | { type: 'SET_NAME'; value: string }
  | { type: 'SET_RACE'; value: string }
  | { type: 'ADD_CLASS' }
  | { type: 'REMOVE_CLASS'; id: string }
  | { type: 'SET_CLASS_NAME'; id: string; value: string }
  | { type: 'SET_CLASS_LEVEL'; id: string; value: string }
  | { type: 'TOGGLE_INSPIRATION' }
  | { type: 'SET_ABILITY_SCORE'; key: AbilityKey; value: string }
  | { type: 'TOGGLE_SAVING_THROW'; key: AbilityKey }
  | { type: 'TOGGLE_SKILL'; key: SkillKey }
  | { type: 'SET_SPEED'; value: string }
  | { type: 'SET_HP_FIELD'; field: keyof HitPoints; value: string }
  | { type: 'SET_HIT_DICE_FIELD'; field: keyof HitDice; value: string }
  | { type: 'SET_EXHAUSTION'; value: number }
  | { type: 'SET_DEATH_SAVES'; field: keyof DeathSaves; value: number }
  | { type: 'SET_CURRENCY_FIELD'; field: keyof Currency; value: string }
  | { type: 'SET_ITEM_QUANTITY'; id: string; value: string }
  | { type: 'TOGGLE_ITEM_EQUIPPED'; id: string }
  | { type: 'SET_FEATURE_USES'; id: string; value: string }
  | { type: 'TOGGLE_SPELL_PREPARED'; id: string }
  | { type: 'SET_SPELL_SLOT_USED'; level: string; value: number }
  | { type: 'SET_BIOGRAPHY_FIELD'; field: keyof Biography; value: string };

function characterReducer(state: CharacterSheet, action: Action): CharacterSheet {
  switch (action.type) {
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
          [action.key]: { ...state.abilities[action.key], score: action.value },
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
    case 'TOGGLE_SKILL':
      return {
        ...state,
        skills: {
          ...state.skills,
          [action.key]: {
            ...state.skills[action.key],
            proficient: !state.skills[action.key].proficient,
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
            equipped: state.inventoryItems[action.id]?.equipped ?? false,
            quantity: action.value,
          },
        },
      };
    case 'TOGGLE_ITEM_EQUIPPED':
      return {
        ...state,
        inventoryItems: {
          ...state.inventoryItems,
          [action.id]: {
            quantity: state.inventoryItems[action.id]?.quantity ?? '1',
            equipped: !(state.inventoryItems[action.id]?.equipped ?? false),
          },
        },
      };
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
  toggleSkillProficiency: (key: SkillKey) => void;
  setSpeed: (value: string) => void;
  setHitPointsField: (field: keyof HitPoints, value: string) => void;
  setHitDiceField: (field: keyof HitDice, value: string) => void;
  setExhaustion: (value: number) => void;
  setDeathSaves: (field: keyof DeathSaves, value: number) => void;
  setCurrencyField: (field: keyof Currency, value: string) => void;
  setItemQuantity: (id: string, value: string) => void;
  toggleItemEquipped: (id: string) => void;
  setFeatureUses: (id: string, value: string) => void;
  toggleSpellPrepared: (id: string) => void;
  setSpellSlotUsed: (level: string, value: number) => void;
  setBiographyField: (field: keyof Biography, value: string) => void;
}

export const CharacterContext = createContext<CharacterContextValue | undefined>(undefined);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [character, dispatch] = useReducer(characterReducer, initialCharacter);

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
      toggleSkillProficiency: (key) => dispatch({ type: 'TOGGLE_SKILL', key }),
      setSpeed: (value) => dispatch({ type: 'SET_SPEED', value }),
      setHitPointsField: (field, value) => dispatch({ type: 'SET_HP_FIELD', field, value }),
      setHitDiceField: (field, value) => dispatch({ type: 'SET_HIT_DICE_FIELD', field, value }),
      setExhaustion: (value) => dispatch({ type: 'SET_EXHAUSTION', value }),
      setDeathSaves: (field, value) => dispatch({ type: 'SET_DEATH_SAVES', field, value }),
      setCurrencyField: (field, value) => dispatch({ type: 'SET_CURRENCY_FIELD', field, value }),
      setItemQuantity: (id, value) => dispatch({ type: 'SET_ITEM_QUANTITY', id, value }),
      toggleItemEquipped: (id) => dispatch({ type: 'TOGGLE_ITEM_EQUIPPED', id }),
      setFeatureUses: (id, value) => dispatch({ type: 'SET_FEATURE_USES', id, value }),
      toggleSpellPrepared: (id) => dispatch({ type: 'TOGGLE_SPELL_PREPARED', id }),
      setSpellSlotUsed: (level, value) => dispatch({ type: 'SET_SPELL_SLOT_USED', level, value }),
      setBiographyField: (field, value) => dispatch({ type: 'SET_BIOGRAPHY_FIELD', field, value }),
    }),
    [character]
  );

  return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>;
}
