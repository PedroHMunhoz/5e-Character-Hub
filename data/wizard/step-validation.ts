// Pure "can I proceed to the next step" gates for the wizard, extracted out
// of app/wizard/*.tsx so they're testable without rendering a component.
// Each function takes the same primitive values the screen already computes
// locally (from its own DB-backed state/local component state) - the screen
// itself is still the one responsible for computing those values, this only
// owns the boolean combination logic that used to live inline in `canProceed`.
//
// Only the Raça and Classe steps are extracted here - the Antecedente/
// Equipamento steps' gates are tightly coupled to per-index local component
// state (toolCategoryChoices/selectedOptionKeys/categoryChoices, keyed by
// dynamically-generated string keys built from array indices), which would
// need a larger structural change to extract cleanly. See docs/testing.md.
import type { AbilityBonusChoiceClause } from './race-ability-bonus';
import type { SkillChoiceClause } from './skill-proficiency-resolver';

// Raça (app/wizard/index.tsx)
export interface RaceStepState {
  raceId: number | null;
  hasSubraceOptions: boolean;
  subraceId: number | null;
  bonusChoiceClause: AbilityBonusChoiceClause | null;
  selectedBonusCount: number;
  raceSkillClause: SkillChoiceClause | null;
  selectedRaceSkillCount: number;
  isDragonborn: boolean;
  draconicAncestry: string | null;
}

export function canProceedFromRaceStep(state: RaceStepState): boolean {
  const needsSubrace = state.hasSubraceOptions && state.subraceId === null;
  const needsBonusChoice = state.bonusChoiceClause ? state.selectedBonusCount < state.bonusChoiceClause.count : false;
  const needsSkillChoice = state.raceSkillClause ? state.selectedRaceSkillCount < state.raceSkillClause.count : false;
  const needsDraconicAncestry = state.isDragonborn && state.draconicAncestry === null;
  return state.raceId !== null && !needsSubrace && !needsBonusChoice && !needsSkillChoice && !needsDraconicAncestry;
}

// Classe (app/wizard/class.tsx)
export interface ClassStepState {
  classId: number | null;
  needsSubclassChoice: boolean;
  subclassId: number | null;
  needsFightingStyle: boolean;
  fightingStyleId: number | null;
  needsFavoredEnemy: boolean;
  favoredEnemyType: string | null;
  isHumanoidFavoredEnemy: boolean;
  favoredEnemyHumanoidRaces: [string | null, string | null];
  favoredEnemyLanguagesResolved: boolean;
  needsFavoredTerrain: boolean;
  favoredTerrainType: string | null;
}

export function canProceedFromClassStep(state: ClassStepState): boolean {
  const favoredEnemySatisfied =
    !state.needsFavoredEnemy ||
    (state.favoredEnemyType !== null &&
      (!state.isHumanoidFavoredEnemy ||
        (state.favoredEnemyHumanoidRaces[0] !== null && state.favoredEnemyHumanoidRaces[1] !== null)) &&
      state.favoredEnemyLanguagesResolved);

  return (
    state.classId !== null &&
    (!state.needsSubclassChoice || state.subclassId !== null) &&
    (!state.needsFightingStyle || state.fightingStyleId !== null) &&
    favoredEnemySatisfied &&
    (!state.needsFavoredTerrain || state.favoredTerrainType !== null)
  );
}
