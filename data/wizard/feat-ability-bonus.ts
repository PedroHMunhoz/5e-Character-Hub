// Parses a feat's `ability` DSL (types/reference.ts's Feat.ability). Same
// general shape as a race's ability_bonuses (data/wizard/race-ability-
// bonus.ts) - a fixed grant, a `choose` clause, or both never combine on any
// single PHB feat - but keyed `amount` instead of `count` under `choose`.
// Confirmed live against every PHB feat with an `ability` field
// (5e-2014-data/feats.json): fixed-only (e.g. Actor `[{"cha":1}]`, Heavily
// Armored `[{"str":1}]`, Durable/Heavy Armor Master/Keen Mind/Linguist same
// pattern) vs `choose`-only (e.g. Athlete `[{"choose":{"from":["str","dex"],
// "amount":1}}]`) - no PHB feat combines both in one entry, but this reads
// the general shape anyway rather than hardcoding that assumption.

import type { AbilityKey } from '@/types/character';
import type { AbilityBonusChoiceClause } from './race-ability-bonus';

const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

function isAbilityKey(value: string): value is AbilityKey {
  return (ABILITY_KEYS as string[]).includes(value);
}

type RawFeatAbilityGroup = Partial<Record<AbilityKey, number>> & {
  choose?: { from: string[]; amount: number };
};

export interface FeatAbilityBonuses {
  fixed: Partial<Record<AbilityKey, number>>;
  choice: AbilityBonusChoiceClause | null;
}

export function getFeatAbilityBonuses(raw: unknown): FeatAbilityBonuses {
  const groups = (raw as RawFeatAbilityGroup[] | null) ?? [];
  const fixed: Partial<Record<AbilityKey, number>> = {};
  let choice: AbilityBonusChoiceClause | null = null;

  for (const group of groups) {
    for (const key of ABILITY_KEYS) {
      const amount = group[key];
      if (typeof amount === 'number') fixed[key] = (fixed[key] ?? 0) + amount;
    }
    // The PHB never has more than one `choose` clause per feat - first one
    // wins, matching data/wizard/race-ability-bonus.ts's combineAbilityBonuses.
    if (group.choose && !choice) {
      choice = { from: group.choose.from.filter(isAbilityKey), count: group.choose.amount };
    }
  }

  return { fixed, choice };
}

// Convenience for callers (the wizard's picker UI) that only care whether
// there's a player choice to render, not any fixed component.
export function getFeatAbilityChoice(raw: unknown): AbilityBonusChoiceClause | null {
  return getFeatAbilityBonuses(raw).choice;
}
