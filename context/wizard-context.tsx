import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import type { ResolvedEquipmentEntry } from '@/data/wizard/equipment-resolver';
import type { AbilityKey, SkillKey } from '@/types/character';

export type AbilityMethod = 'roll' | 'array' | 'pointBuy';
export type EquipmentMode = 'starting' | 'gold';

// The character being built, mid-wizard. Deliberately looser/more nullable
// than CharacterSheet (types/character.ts) - fields fill in incrementally
// as the player moves through steps - and keyed by reference ids (raceId,
// classId, ...) rather than display strings, since those ids are what the
// rest of the wizard's data layer (data/queries/*, data/wizard/*) needs to
// resolve features/equipment/spells. Never persisted to characters.db until
// the final "Detalhes" step commits it as a real CharacterSheet - abandoning
// the wizard midway leaves no orphaned row.
export interface WizardDraft {
  // Passo 1: Raça
  raceId: number | null;
  subraceId: number | null;
  // Extra bonus amount the player assigned to each ability via a race's
  // `choose` clause (e.g. Half-Elf's "+1 to two abilities of your choice").
  // Fixed (non-`choose`) bonuses aren't stored here - they're re-derived
  // from the race/subrace's own ability_bonuses whenever needed, since they
  // never change once a race is picked.
  abilityBonusChoices: Partial<Record<AbilityKey, number>>;
  // Dragonborn-only (see constants/draconic-ancestry.ts) - not modeled as a
  // subrace at all, since the PHB's 10 lineages come from an unexpanded
  // 5etools templating mechanism rather than real subrace rows.
  draconicAncestry: string | null;

  // Passo 2: Classe
  classId: number | null;
  subclassId: number | null;

  // Passo 3: Atributos
  abilityMethod: AbilityMethod | null;
  baseAbilityScores: Partial<Record<AbilityKey, number>>;

  // Passo 4: Antecedente, Perícias e Ferramentas
  backgroundId: number | null;
  classSkillChoices: SkillKey[];
  // Skills chosen for a race's own `choose` clause (only Half-Elf's
  // Versatilidade em Perícias has one in the PHB) - kept separate from
  // classSkillChoices since they're resolved from a different pool/section
  // in app/wizard/background.tsx. Fixed race skills (Elf/Half-Orc) aren't
  // stored here - they're re-derived from the race's own skillProficiencies
  // whenever needed, same as fixed ability bonuses.
  raceSkillChoices: SkillKey[];
  expertiseSkillChoices: SkillKey[];
  // Resolved tool grants (fixed + player-picked category choices), see
  // data/wizard/tool-proficiency-resolver.ts.
  toolProficiencies: ResolvedEquipmentEntry[];

  // Passo 5: Equipamento
  equipmentMode: EquipmentMode | null;
  // Final flattened list of granted items, resolved by the equipment step
  // itself (a/b/c choices and categoryChoice entries already settled) -
  // same "resolve before leaving the step" pattern as toolProficiencies
  // above, so the final assembly step (Detalhes) doesn't need to re-parse
  // the DSL or re-resolve anything.
  chosenEquipment: ResolvedEquipmentEntry[];
  goldRolled: number | null;

  // Passo 6: Magias
  spellIds: number[];

  // Passo 7: Detalhes
  name: string;
}

const initialDraft: WizardDraft = {
  raceId: null,
  subraceId: null,
  abilityBonusChoices: {},
  draconicAncestry: null,
  classId: null,
  subclassId: null,
  abilityMethod: null,
  baseAbilityScores: {},
  backgroundId: null,
  classSkillChoices: [],
  raceSkillChoices: [],
  expertiseSkillChoices: [],
  toolProficiencies: [],
  // Defaults to 'starting' (not null) - the equipment step already renders
  // the class/background equipment section by default (the "gold" tab only
  // shows once explicitly picked), so the "Equipamento inicial" pill should
  // start visually selected to match, rather than showing neither pill lit.
  equipmentMode: 'starting',
  chosenEquipment: [],
  goldRolled: null,
  spellIds: [],
  name: '',
};

type Action =
  | { type: 'SET_RACE'; raceId: number | null }
  | { type: 'SET_SUBRACE'; subraceId: number | null }
  | { type: 'SET_ABILITY_BONUS_CHOICES'; choices: Partial<Record<AbilityKey, number>> }
  | { type: 'SET_DRACONIC_ANCESTRY'; ancestry: string | null }
  | { type: 'SET_CLASS'; classId: number | null }
  | { type: 'SET_SUBCLASS'; subclassId: number | null }
  | { type: 'SET_ABILITY_METHOD'; method: AbilityMethod | null }
  | { type: 'SET_BASE_ABILITY_SCORES'; scores: Partial<Record<AbilityKey, number>> }
  | { type: 'SET_BACKGROUND'; backgroundId: number | null }
  | { type: 'SET_CLASS_SKILL_CHOICES'; keys: SkillKey[] }
  | { type: 'SET_RACE_SKILL_CHOICES'; keys: SkillKey[] }
  | { type: 'SET_EXPERTISE_SKILL_CHOICES'; keys: SkillKey[] }
  | { type: 'SET_TOOL_PROFICIENCIES'; entries: ResolvedEquipmentEntry[] }
  | { type: 'SET_EQUIPMENT_MODE'; mode: EquipmentMode | null }
  | { type: 'SET_CHOSEN_EQUIPMENT'; entries: ResolvedEquipmentEntry[] }
  | { type: 'SET_GOLD_ROLLED'; value: number | null }
  | { type: 'SET_SPELL_IDS'; ids: number[] }
  | { type: 'SET_NAME'; value: string }
  | { type: 'RESET' };

function wizardReducer(state: WizardDraft, action: Action): WizardDraft {
  switch (action.type) {
    case 'SET_RACE':
      // Changing race invalidates whatever subrace/ability-bonus/ancestry
      // choices were made for the previous race.
      return {
        ...state,
        raceId: action.raceId,
        subraceId: null,
        abilityBonusChoices: {},
        draconicAncestry: null,
        raceSkillChoices: [],
      };
    case 'SET_SUBRACE':
      return { ...state, subraceId: action.subraceId, abilityBonusChoices: {} };
    case 'SET_ABILITY_BONUS_CHOICES':
      return { ...state, abilityBonusChoices: action.choices };
    case 'SET_DRACONIC_ANCESTRY':
      return { ...state, draconicAncestry: action.ancestry };
    case 'SET_CLASS':
      return { ...state, classId: action.classId, subclassId: null };
    case 'SET_SUBCLASS':
      return { ...state, subclassId: action.subclassId };
    case 'SET_ABILITY_METHOD':
      return { ...state, abilityMethod: action.method, baseAbilityScores: {} };
    case 'SET_BASE_ABILITY_SCORES':
      return { ...state, baseAbilityScores: action.scores };
    case 'SET_BACKGROUND':
      return { ...state, backgroundId: action.backgroundId, classSkillChoices: [] };
    case 'SET_CLASS_SKILL_CHOICES':
      return { ...state, classSkillChoices: action.keys };
    case 'SET_RACE_SKILL_CHOICES':
      return { ...state, raceSkillChoices: action.keys };
    case 'SET_EXPERTISE_SKILL_CHOICES':
      return { ...state, expertiseSkillChoices: action.keys };
    case 'SET_TOOL_PROFICIENCIES':
      return { ...state, toolProficiencies: action.entries };
    case 'SET_EQUIPMENT_MODE':
      return { ...state, equipmentMode: action.mode };
    case 'SET_CHOSEN_EQUIPMENT':
      return { ...state, chosenEquipment: action.entries };
    case 'SET_GOLD_ROLLED':
      return { ...state, goldRolled: action.value };
    case 'SET_SPELL_IDS':
      return { ...state, spellIds: action.ids };
    case 'SET_NAME':
      return { ...state, name: action.value };
    case 'RESET':
      return initialDraft;
    default:
      return state;
  }
}

export interface WizardContextValue {
  draft: WizardDraft;
  setRace: (raceId: number | null) => void;
  setSubrace: (subraceId: number | null) => void;
  setAbilityBonusChoices: (choices: Partial<Record<AbilityKey, number>>) => void;
  setDraconicAncestry: (ancestry: string | null) => void;
  setClass: (classId: number | null) => void;
  setSubclass: (subclassId: number | null) => void;
  setAbilityMethod: (method: AbilityMethod | null) => void;
  setBaseAbilityScores: (scores: Partial<Record<AbilityKey, number>>) => void;
  setBackground: (backgroundId: number | null) => void;
  setClassSkillChoices: (keys: SkillKey[]) => void;
  setRaceSkillChoices: (keys: SkillKey[]) => void;
  setExpertiseSkillChoices: (keys: SkillKey[]) => void;
  setToolProficiencies: (entries: ResolvedEquipmentEntry[]) => void;
  setEquipmentMode: (mode: EquipmentMode | null) => void;
  setChosenEquipment: (entries: ResolvedEquipmentEntry[]) => void;
  setGoldRolled: (value: number | null) => void;
  setSpellIds: (ids: number[]) => void;
  setDraftName: (value: string) => void;
  reset: () => void;
}

const WizardContext = createContext<WizardContextValue | undefined>(undefined);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [draft, dispatch] = useReducer(wizardReducer, initialDraft);

  const value = useMemo<WizardContextValue>(
    () => ({
      draft,
      setRace: (raceId) => dispatch({ type: 'SET_RACE', raceId }),
      setSubrace: (subraceId) => dispatch({ type: 'SET_SUBRACE', subraceId }),
      setAbilityBonusChoices: (choices) => dispatch({ type: 'SET_ABILITY_BONUS_CHOICES', choices }),
      setDraconicAncestry: (ancestry) => dispatch({ type: 'SET_DRACONIC_ANCESTRY', ancestry }),
      setClass: (classId) => dispatch({ type: 'SET_CLASS', classId }),
      setSubclass: (subclassId) => dispatch({ type: 'SET_SUBCLASS', subclassId }),
      setAbilityMethod: (method) => dispatch({ type: 'SET_ABILITY_METHOD', method }),
      setBaseAbilityScores: (scores) => dispatch({ type: 'SET_BASE_ABILITY_SCORES', scores }),
      setBackground: (backgroundId) => dispatch({ type: 'SET_BACKGROUND', backgroundId }),
      setClassSkillChoices: (keys) => dispatch({ type: 'SET_CLASS_SKILL_CHOICES', keys }),
      setRaceSkillChoices: (keys) => dispatch({ type: 'SET_RACE_SKILL_CHOICES', keys }),
      setExpertiseSkillChoices: (keys) => dispatch({ type: 'SET_EXPERTISE_SKILL_CHOICES', keys }),
      setToolProficiencies: (entries) => dispatch({ type: 'SET_TOOL_PROFICIENCIES', entries }),
      setEquipmentMode: (mode) => dispatch({ type: 'SET_EQUIPMENT_MODE', mode }),
      setChosenEquipment: (entries) => dispatch({ type: 'SET_CHOSEN_EQUIPMENT', entries }),
      setGoldRolled: (value) => dispatch({ type: 'SET_GOLD_ROLLED', value }),
      setSpellIds: (ids) => dispatch({ type: 'SET_SPELL_IDS', ids }),
      setDraftName: (value) => dispatch({ type: 'SET_NAME', value }),
      reset: () => dispatch({ type: 'RESET' }),
    }),
    [draft]
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizardDraft(): WizardContextValue {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizardDraft must be used within a WizardProvider');
  }
  return context;
}
