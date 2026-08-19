// Direct unit tests for the extracted wizard step gates (data/wizard/
// step-validation.ts) - no DB, no draft, just the primitive inputs each
// screen already computes locally. See docs/testing.md.
import { describe, expect, it } from 'vitest';

import { canProceedFromClassStep, canProceedFromRaceStep, type ClassStepState, type RaceStepState } from '@/data/wizard/step-validation';

const baseRaceState: RaceStepState = {
  raceId: 1,
  hasSubraceOptions: false,
  subraceId: null,
  bonusChoiceClause: null,
  selectedBonusCount: 0,
  raceSkillClause: null,
  selectedRaceSkillCount: 0,
  isDragonborn: false,
  draconicAncestry: null,
};

describe('canProceedFromRaceStep', () => {
  it('blocks when no race is chosen yet', () => {
    expect(canProceedFromRaceStep({ ...baseRaceState, raceId: null })).toBe(false);
  });

  it('allows a race with no subrace, no choices, and no draconic ancestry (e.g. plain Human)', () => {
    expect(canProceedFromRaceStep(baseRaceState)).toBe(true);
  });

  it('blocks when the race has subrace options and none is picked yet (e.g. Dwarf before choosing Hill/Mountain)', () => {
    expect(canProceedFromRaceStep({ ...baseRaceState, hasSubraceOptions: true, subraceId: null })).toBe(false);
  });

  it('allows once a subrace is picked', () => {
    expect(canProceedFromRaceStep({ ...baseRaceState, hasSubraceOptions: true, subraceId: 42 })).toBe(true);
  });

  it('blocks an ability-bonus choose clause until enough abilities are picked (e.g. Half-Elf)', () => {
    const clause = { from: ['str', 'dex', 'con', 'int', 'wis'] as const, count: 2 };
    expect(
      canProceedFromRaceStep({ ...baseRaceState, bonusChoiceClause: { from: [...clause.from], count: clause.count }, selectedBonusCount: 1 })
    ).toBe(false);
    expect(
      canProceedFromRaceStep({ ...baseRaceState, bonusChoiceClause: { from: [...clause.from], count: clause.count }, selectedBonusCount: 2 })
    ).toBe(true);
  });

  it('blocks a race skill choice clause until enough skills are picked (e.g. Half-Elf Skill Versatility)', () => {
    expect(
      canProceedFromRaceStep({ ...baseRaceState, raceSkillClause: { from: [], count: 2 }, selectedRaceSkillCount: 1 })
    ).toBe(false);
    expect(
      canProceedFromRaceStep({ ...baseRaceState, raceSkillClause: { from: [], count: 2 }, selectedRaceSkillCount: 2 })
    ).toBe(true);
  });

  it('blocks a Dragonborn until a draconic ancestry is chosen', () => {
    expect(canProceedFromRaceStep({ ...baseRaceState, isDragonborn: true, draconicAncestry: null })).toBe(false);
    expect(canProceedFromRaceStep({ ...baseRaceState, isDragonborn: true, draconicAncestry: 'red' })).toBe(true);
  });
});

const baseClassState: ClassStepState = {
  classId: 1,
  needsSubclassChoice: false,
  subclassId: null,
  needsFightingStyle: false,
  fightingStyleId: null,
  needsFavoredEnemy: false,
  favoredEnemyType: null,
  isHumanoidFavoredEnemy: false,
  favoredEnemyHumanoidRaces: [null, null],
  favoredEnemyLanguagesResolved: false,
  needsFavoredTerrain: false,
  favoredTerrainType: null,
};

describe('canProceedFromClassStep', () => {
  it('blocks when no class is chosen yet', () => {
    expect(canProceedFromClassStep({ ...baseClassState, classId: null })).toBe(false);
  });

  it('allows a class with none of the level-1 sub-choices (most PHB classes)', () => {
    expect(canProceedFromClassStep(baseClassState)).toBe(true);
  });

  it('blocks a subclass-at-1 class until one is picked (e.g. Cleric Divine Domain)', () => {
    expect(canProceedFromClassStep({ ...baseClassState, needsSubclassChoice: true, subclassId: null })).toBe(false);
    expect(canProceedFromClassStep({ ...baseClassState, needsSubclassChoice: true, subclassId: 7 })).toBe(true);
  });

  it('blocks Fighter until a Fighting Style is picked', () => {
    expect(canProceedFromClassStep({ ...baseClassState, needsFightingStyle: true, fightingStyleId: null })).toBe(false);
    expect(canProceedFromClassStep({ ...baseClassState, needsFightingStyle: true, fightingStyleId: 3 })).toBe(true);
  });

  it('blocks Ranger until Favored Enemy type + its language(s) are resolved', () => {
    expect(
      canProceedFromClassStep({ ...baseClassState, needsFavoredEnemy: true, favoredEnemyType: null })
    ).toBe(false);
    expect(
      canProceedFromClassStep({
        ...baseClassState,
        needsFavoredEnemy: true,
        favoredEnemyType: 'dragon',
        favoredEnemyLanguagesResolved: false,
      })
    ).toBe(false);
    expect(
      canProceedFromClassStep({
        ...baseClassState,
        needsFavoredEnemy: true,
        favoredEnemyType: 'dragon',
        favoredEnemyLanguagesResolved: true,
      })
    ).toBe(true);
  });

  it('blocks the humanoid Favored Enemy alternative until both races are picked', () => {
    expect(
      canProceedFromClassStep({
        ...baseClassState,
        needsFavoredEnemy: true,
        favoredEnemyType: 'humanoid',
        isHumanoidFavoredEnemy: true,
        favoredEnemyHumanoidRaces: ['orc', null],
        favoredEnemyLanguagesResolved: true,
      })
    ).toBe(false);
    expect(
      canProceedFromClassStep({
        ...baseClassState,
        needsFavoredEnemy: true,
        favoredEnemyType: 'humanoid',
        isHumanoidFavoredEnemy: true,
        favoredEnemyHumanoidRaces: ['orc', 'goblin'],
        favoredEnemyLanguagesResolved: true,
      })
    ).toBe(true);
  });

  it('blocks Ranger until a Favored Terrain is picked', () => {
    expect(canProceedFromClassStep({ ...baseClassState, needsFavoredTerrain: true, favoredTerrainType: null })).toBe(false);
    expect(canProceedFromClassStep({ ...baseClassState, needsFavoredTerrain: true, favoredTerrainType: 'forest' })).toBe(
      true
    );
  });
});
