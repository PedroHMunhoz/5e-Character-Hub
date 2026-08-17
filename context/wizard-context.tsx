import { createContext, useContext, useMemo, useReducer, type ReactNode } from 'react';

import { FAVORED_ENEMY_HUMANOID_KEY, FAVORED_ENEMY_NO_LANGUAGE } from '@/constants/favored-enemy';
import type { ResolvedEquipmentEntry } from '@/data/wizard/equipment-resolver';
import type { AbilityKey, SkillKey } from '@/types/character';

export type AbilityMethod = 'roll' | 'array' | 'pointBuy';
export type EquipmentMode = 'starting' | 'gold';

// One favored-enemy language slot: null = not resolved yet,
// FAVORED_ENEMY_NO_LANGUAGE = locked "doesn't speak one", number = a real
// languages.id (locked when it's the only option, player-picked when the
// type/race has more than one plausible language - see
// constants/favored-enemy.ts).
export type FavoredEnemyLanguageSlot = number | typeof FAVORED_ENEMY_NO_LANGUAGE | null;

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
  // Only meaningful when the chosen race/subrace is in
  // constants/race-feat-grants.ts (Variant Human in the PHB) - resolved and
  // validated in the Abilities step (Passo 3), not here, since eligibility
  // depends on final ability scores/class. See
  // components/wizard/feat-choice.tsx.
  featId: number | null;
  // Only meaningful when the chosen `featId` has its own ability-bonus
  // `choose` clause (see data/wizard/feat-ability-bonus.ts, e.g. Athlete's
  // "Strength or Dexterity") - separate from the race's own
  // abilityBonusChoices above.
  featAbilityChoice: AbilityKey | null;

  // Passo 2: Classe
  classId: number | null;
  subclassId: number | null;
  // Fighter-only at level 1 in the PHB (Paladin/Ranger get theirs at level
  // 2, out of scope - see classGrantsFightingStyleAtLevel1). Stores the
  // optional_features row id, resolved to the stable English name at
  // assembly time (see data/wizard/assemble-character.ts).
  fightingStyleId: number | null;
  // Ranger-only (see constants/favored-enemy.ts) - a creature-type key, or
  // FAVORED_ENEMY_HUMANOID_KEY when the player picked "two humanoid races"
  // instead. Not modeled via a DB catalog id (unlike fightingStyleId) since
  // there's no optional_features row backing these options.
  favoredEnemyType: string | null;
  // Only meaningful when favoredEnemyType === FAVORED_ENEMY_HUMANOID_KEY -
  // two distinct HumanoidRaceOption keys from constants/favored-enemy.ts.
  favoredEnemyHumanoidRaces: [string | null, string | null];
  // Ranger-only (see constants/favored-terrain.ts) - a terrain key. Lives
  // inside the "Natural Explorer" class feature, not a feature of its own.
  favoredTerrainType: string | null;
  // Ranger-only, the language(s) granted alongside favoredEnemyType (PHB:
  // "you also learn one language of your choice that is spoken by your
  // favored enemies, if they speak one at all"). Slot 0 is the single
  // creature type's language (or the first humanoid race's, when
  // favoredEnemyType === FAVORED_ENEMY_HUMANOID_KEY); slot 1 is only used
  // for the second humanoid race - each favored enemy grants its own
  // language, so the two races in the humanoid alternative resolve
  // independently instead of sharing one pick.
  favoredEnemyLanguageIds: [FavoredEnemyLanguageSlot, FavoredEnemyLanguageSlot];

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
  // Language ids (data/queries/languages.ts's Language.id) picked for the
  // race's own anyStandard choice (e.g. Human, Half-Elf, High Elf) and the
  // background's anyStandard choice - kept separate for the same reason as
  // classSkillChoices/raceSkillChoices (different pools, different reset
  // triggers). Fixed languages (every race's Common + own language) aren't
  // stored here - re-derived from race/background.languages whenever needed.
  raceLanguageChoices: number[];
  backgroundLanguageChoices: number[];
  expertiseSkillChoices: SkillKey[];
  // itemKey() of the tool swapped in for one of the two Expertise skill
  // picks (RAW: "one skill proficiency and your proficiency with thieves'
  // tools" - Rogue only). Null when both picks are ordinary skills.
  expertiseToolChoice: string | null;
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
  featId: null,
  featAbilityChoice: null,
  classId: null,
  subclassId: null,
  fightingStyleId: null,
  favoredEnemyType: null,
  favoredEnemyHumanoidRaces: [null, null],
  favoredTerrainType: null,
  favoredEnemyLanguageIds: [null, null],
  abilityMethod: null,
  baseAbilityScores: {},
  backgroundId: null,
  classSkillChoices: [],
  raceSkillChoices: [],
  raceLanguageChoices: [],
  backgroundLanguageChoices: [],
  expertiseSkillChoices: [],
  expertiseToolChoice: null,
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
  | { type: 'SET_FEAT'; featId: number | null }
  | { type: 'SET_FEAT_ABILITY_CHOICE'; ability: AbilityKey | null }
  | { type: 'SET_CLASS'; classId: number | null }
  | { type: 'SET_SUBCLASS'; subclassId: number | null }
  | { type: 'SET_FIGHTING_STYLE'; fightingStyleId: number | null }
  | { type: 'SET_FAVORED_ENEMY_TYPE'; favoredEnemyType: string | null }
  | { type: 'SET_FAVORED_ENEMY_HUMANOID_RACES'; races: [string | null, string | null] }
  | { type: 'SET_FAVORED_TERRAIN'; favoredTerrainType: string | null }
  | { type: 'SET_FAVORED_ENEMY_LANGUAGE'; slot: 0 | 1; value: number | typeof FAVORED_ENEMY_NO_LANGUAGE }
  | { type: 'SET_ABILITY_METHOD'; method: AbilityMethod | null }
  | { type: 'SET_BASE_ABILITY_SCORES'; scores: Partial<Record<AbilityKey, number>> }
  | { type: 'SET_BACKGROUND'; backgroundId: number | null }
  | { type: 'SET_CLASS_SKILL_CHOICES'; keys: SkillKey[] }
  | { type: 'SET_RACE_SKILL_CHOICES'; keys: SkillKey[] }
  | { type: 'SET_RACE_LANGUAGE_CHOICES'; ids: number[] }
  | { type: 'SET_BACKGROUND_LANGUAGE_CHOICES'; ids: number[] }
  | { type: 'SET_EXPERTISE_SKILL_CHOICES'; keys: SkillKey[] }
  | { type: 'SET_EXPERTISE_TOOL_CHOICE'; key: string | null }
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
      // Changing race invalidates whatever subrace/ability-bonus/ancestry/
      // feat choices were made for the previous race.
      return {
        ...state,
        raceId: action.raceId,
        subraceId: null,
        abilityBonusChoices: {},
        draconicAncestry: null,
        raceSkillChoices: [],
        raceLanguageChoices: [],
        featId: null,
        featAbilityChoice: null,
      };
    case 'SET_SUBRACE':
      return {
        ...state,
        subraceId: action.subraceId,
        abilityBonusChoices: {},
        raceLanguageChoices: [],
        featId: null,
        featAbilityChoice: null,
      };
    case 'SET_ABILITY_BONUS_CHOICES':
      return { ...state, abilityBonusChoices: action.choices };
    case 'SET_DRACONIC_ANCESTRY':
      return { ...state, draconicAncestry: action.ancestry };
    case 'SET_FEAT':
      return { ...state, featId: action.featId, featAbilityChoice: null };
    case 'SET_FEAT_ABILITY_CHOICE':
      return { ...state, featAbilityChoice: action.ability };
    case 'SET_CLASS':
      return {
        ...state,
        classId: action.classId,
        subclassId: null,
        fightingStyleId: null,
        favoredEnemyType: null,
        favoredEnemyHumanoidRaces: [null, null],
        favoredTerrainType: null,
        favoredEnemyLanguageIds: [null, null],
      };
    case 'SET_SUBCLASS':
      return { ...state, subclassId: action.subclassId };
    case 'SET_FIGHTING_STYLE':
      return { ...state, fightingStyleId: action.fightingStyleId };
    case 'SET_FAVORED_ENEMY_TYPE':
      // Switching away from the humanoid-races option invalidates whatever
      // race picks were made for it. Any type change also invalidates both
      // language slots, since they're derived from the type/races - the
      // wizard's auto-resolve effect re-fills them right away.
      return {
        ...state,
        favoredEnemyType: action.favoredEnemyType,
        favoredEnemyHumanoidRaces:
          action.favoredEnemyType === FAVORED_ENEMY_HUMANOID_KEY ? state.favoredEnemyHumanoidRaces : [null, null],
        favoredEnemyLanguageIds: [null, null],
      };
    case 'SET_FAVORED_ENEMY_HUMANOID_RACES': {
      // Guard against both slots ending up with the same race (e.g. changing
      // the first pick to match the already-chosen second one) - null out
      // the second slot instead of allowing a duplicate. Every humanoid race
      // resolves to exactly one language (see constants/favored-enemy.ts),
      // so a race change always invalidates that slot's language too - safe
      // to reset both, the auto-resolve effect immediately re-locks them.
      const [first, second] = action.races;
      return {
        ...state,
        favoredEnemyHumanoidRaces: first !== null && first === second ? [first, null] : [first, second],
        favoredEnemyLanguageIds: [null, null],
      };
    }
    case 'SET_FAVORED_TERRAIN':
      return { ...state, favoredTerrainType: action.favoredTerrainType };
    case 'SET_FAVORED_ENEMY_LANGUAGE': {
      const next: [FavoredEnemyLanguageSlot, FavoredEnemyLanguageSlot] = [...state.favoredEnemyLanguageIds];
      next[action.slot] = action.value;
      return { ...state, favoredEnemyLanguageIds: next };
    }
    case 'SET_ABILITY_METHOD':
      return { ...state, abilityMethod: action.method, baseAbilityScores: {} };
    case 'SET_BASE_ABILITY_SCORES':
      return { ...state, baseAbilityScores: action.scores };
    case 'SET_BACKGROUND':
      return { ...state, backgroundId: action.backgroundId, classSkillChoices: [], backgroundLanguageChoices: [] };
    case 'SET_CLASS_SKILL_CHOICES':
      return { ...state, classSkillChoices: action.keys };
    case 'SET_RACE_SKILL_CHOICES':
      return { ...state, raceSkillChoices: action.keys };
    case 'SET_RACE_LANGUAGE_CHOICES':
      return { ...state, raceLanguageChoices: action.ids };
    case 'SET_BACKGROUND_LANGUAGE_CHOICES':
      return { ...state, backgroundLanguageChoices: action.ids };
    case 'SET_EXPERTISE_SKILL_CHOICES':
      return { ...state, expertiseSkillChoices: action.keys };
    case 'SET_EXPERTISE_TOOL_CHOICE':
      return { ...state, expertiseToolChoice: action.key };
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
  setFeat: (featId: number | null) => void;
  setFeatAbilityChoice: (ability: AbilityKey | null) => void;
  setClass: (classId: number | null) => void;
  setSubclass: (subclassId: number | null) => void;
  setFightingStyle: (fightingStyleId: number | null) => void;
  setFavoredEnemyType: (favoredEnemyType: string | null) => void;
  setFavoredEnemyHumanoidRaces: (races: [string | null, string | null]) => void;
  setFavoredTerrain: (favoredTerrainType: string | null) => void;
  setFavoredEnemyLanguage: (slot: 0 | 1, value: number | typeof FAVORED_ENEMY_NO_LANGUAGE) => void;
  setAbilityMethod: (method: AbilityMethod | null) => void;
  setBaseAbilityScores: (scores: Partial<Record<AbilityKey, number>>) => void;
  setBackground: (backgroundId: number | null) => void;
  setClassSkillChoices: (keys: SkillKey[]) => void;
  setRaceSkillChoices: (keys: SkillKey[]) => void;
  setRaceLanguageChoices: (ids: number[]) => void;
  setBackgroundLanguageChoices: (ids: number[]) => void;
  setExpertiseSkillChoices: (keys: SkillKey[]) => void;
  setExpertiseToolChoice: (key: string | null) => void;
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
      setFeat: (featId) => dispatch({ type: 'SET_FEAT', featId }),
      setFeatAbilityChoice: (ability) => dispatch({ type: 'SET_FEAT_ABILITY_CHOICE', ability }),
      setClass: (classId) => dispatch({ type: 'SET_CLASS', classId }),
      setSubclass: (subclassId) => dispatch({ type: 'SET_SUBCLASS', subclassId }),
      setFightingStyle: (fightingStyleId) => dispatch({ type: 'SET_FIGHTING_STYLE', fightingStyleId }),
      setFavoredEnemyType: (favoredEnemyType) => dispatch({ type: 'SET_FAVORED_ENEMY_TYPE', favoredEnemyType }),
      setFavoredEnemyHumanoidRaces: (races) => dispatch({ type: 'SET_FAVORED_ENEMY_HUMANOID_RACES', races }),
      setFavoredTerrain: (favoredTerrainType) => dispatch({ type: 'SET_FAVORED_TERRAIN', favoredTerrainType }),
      setFavoredEnemyLanguage: (slot, value) => dispatch({ type: 'SET_FAVORED_ENEMY_LANGUAGE', slot, value }),
      setAbilityMethod: (method) => dispatch({ type: 'SET_ABILITY_METHOD', method }),
      setBaseAbilityScores: (scores) => dispatch({ type: 'SET_BASE_ABILITY_SCORES', scores }),
      setBackground: (backgroundId) => dispatch({ type: 'SET_BACKGROUND', backgroundId }),
      setClassSkillChoices: (keys) => dispatch({ type: 'SET_CLASS_SKILL_CHOICES', keys }),
      setRaceSkillChoices: (keys) => dispatch({ type: 'SET_RACE_SKILL_CHOICES', keys }),
      setRaceLanguageChoices: (ids) => dispatch({ type: 'SET_RACE_LANGUAGE_CHOICES', ids }),
      setBackgroundLanguageChoices: (ids) => dispatch({ type: 'SET_BACKGROUND_LANGUAGE_CHOICES', ids }),
      setExpertiseSkillChoices: (keys) => dispatch({ type: 'SET_EXPERTISE_SKILL_CHOICES', keys }),
      setExpertiseToolChoice: (key) => dispatch({ type: 'SET_EXPERTISE_TOOL_CHOICE', key }),
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
