import { createContext, useMemo, useReducer, type ReactNode } from 'react';

import { ABILITIES, SKILLS } from '@/constants/character';
import type { AbilityKey, CharacterSheet, HitPoints, SkillKey } from '@/types/character';

const initialCharacter: CharacterSheet = {
  proficiencyBonus: '',
  abilities: Object.fromEntries(
    ABILITIES.map((ability) => [ability.key, { score: '', modifier: '' }])
  ) as CharacterSheet['abilities'],
  savingThrows: Object.fromEntries(
    ABILITIES.map((ability) => [ability.key, { proficient: false, modifier: '' }])
  ) as CharacterSheet['savingThrows'],
  skills: Object.fromEntries(
    SKILLS.map((skill) => [skill.key, { proficient: false, modifier: '' }])
  ) as CharacterSheet['skills'],
  passivePerception: '',
  passiveInsight: '',
  armorClass: '',
  initiative: '',
  speed: '',
  hitPoints: { max: '', current: '', temporary: '' },
};

type Action =
  | { type: 'SET_ABILITY_SCORE'; key: AbilityKey; value: string }
  | { type: 'SET_ABILITY_MODIFIER'; key: AbilityKey; value: string }
  | { type: 'TOGGLE_SAVING_THROW'; key: AbilityKey }
  | { type: 'SET_SAVING_THROW_MODIFIER'; key: AbilityKey; value: string }
  | { type: 'TOGGLE_SKILL'; key: SkillKey }
  | { type: 'SET_SKILL_MODIFIER'; key: SkillKey; value: string }
  | { type: 'SET_PROFICIENCY_BONUS'; value: string }
  | { type: 'SET_PASSIVE_PERCEPTION'; value: string }
  | { type: 'SET_PASSIVE_INSIGHT'; value: string }
  | { type: 'SET_ARMOR_CLASS'; value: string }
  | { type: 'SET_INITIATIVE'; value: string }
  | { type: 'SET_SPEED'; value: string }
  | { type: 'SET_HP_FIELD'; field: keyof HitPoints; value: string };

function characterReducer(state: CharacterSheet, action: Action): CharacterSheet {
  switch (action.type) {
    case 'SET_ABILITY_SCORE':
      return {
        ...state,
        abilities: {
          ...state.abilities,
          [action.key]: { ...state.abilities[action.key], score: action.value },
        },
      };
    case 'SET_ABILITY_MODIFIER':
      return {
        ...state,
        abilities: {
          ...state.abilities,
          [action.key]: { ...state.abilities[action.key], modifier: action.value },
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
    case 'SET_SAVING_THROW_MODIFIER':
      return {
        ...state,
        savingThrows: {
          ...state.savingThrows,
          [action.key]: { ...state.savingThrows[action.key], modifier: action.value },
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
    case 'SET_SKILL_MODIFIER':
      return {
        ...state,
        skills: {
          ...state.skills,
          [action.key]: { ...state.skills[action.key], modifier: action.value },
        },
      };
    case 'SET_PROFICIENCY_BONUS':
      return { ...state, proficiencyBonus: action.value };
    case 'SET_PASSIVE_PERCEPTION':
      return { ...state, passivePerception: action.value };
    case 'SET_PASSIVE_INSIGHT':
      return { ...state, passiveInsight: action.value };
    case 'SET_ARMOR_CLASS':
      return { ...state, armorClass: action.value };
    case 'SET_INITIATIVE':
      return { ...state, initiative: action.value };
    case 'SET_SPEED':
      return { ...state, speed: action.value };
    case 'SET_HP_FIELD':
      return {
        ...state,
        hitPoints: { ...state.hitPoints, [action.field]: action.value },
      };
    default:
      return state;
  }
}

export interface CharacterContextValue {
  character: CharacterSheet;
  setAbilityScore: (key: AbilityKey, value: string) => void;
  setAbilityModifier: (key: AbilityKey, value: string) => void;
  toggleSavingThrowProficiency: (key: AbilityKey) => void;
  setSavingThrowModifier: (key: AbilityKey, value: string) => void;
  toggleSkillProficiency: (key: SkillKey) => void;
  setSkillModifier: (key: SkillKey, value: string) => void;
  setProficiencyBonus: (value: string) => void;
  setPassivePerception: (value: string) => void;
  setPassiveInsight: (value: string) => void;
  setArmorClass: (value: string) => void;
  setInitiative: (value: string) => void;
  setSpeed: (value: string) => void;
  setHitPointsField: (field: keyof HitPoints, value: string) => void;
}

export const CharacterContext = createContext<CharacterContextValue | undefined>(undefined);

export function CharacterProvider({ children }: { children: ReactNode }) {
  const [character, dispatch] = useReducer(characterReducer, initialCharacter);

  const value = useMemo<CharacterContextValue>(
    () => ({
      character,
      setAbilityScore: (key, value) => dispatch({ type: 'SET_ABILITY_SCORE', key, value }),
      setAbilityModifier: (key, value) => dispatch({ type: 'SET_ABILITY_MODIFIER', key, value }),
      toggleSavingThrowProficiency: (key) => dispatch({ type: 'TOGGLE_SAVING_THROW', key }),
      setSavingThrowModifier: (key, value) =>
        dispatch({ type: 'SET_SAVING_THROW_MODIFIER', key, value }),
      toggleSkillProficiency: (key) => dispatch({ type: 'TOGGLE_SKILL', key }),
      setSkillModifier: (key, value) => dispatch({ type: 'SET_SKILL_MODIFIER', key, value }),
      setProficiencyBonus: (value) => dispatch({ type: 'SET_PROFICIENCY_BONUS', value }),
      setPassivePerception: (value) => dispatch({ type: 'SET_PASSIVE_PERCEPTION', value }),
      setPassiveInsight: (value) => dispatch({ type: 'SET_PASSIVE_INSIGHT', value }),
      setArmorClass: (value) => dispatch({ type: 'SET_ARMOR_CLASS', value }),
      setInitiative: (value) => dispatch({ type: 'SET_INITIATIVE', value }),
      setSpeed: (value) => dispatch({ type: 'SET_SPEED', value }),
      setHitPointsField: (field, value) => dispatch({ type: 'SET_HP_FIELD', field, value }),
    }),
    [character]
  );

  return <CharacterContext.Provider value={value}>{children}</CharacterContext.Provider>;
}
