// Combines a race's (and, if picked, its subrace's) ability_bonuses JSON
// into the fixed bonuses (always granted) and any `choose` clauses (the
// player picks which abilities benefit) - confirmed shapes, e.g. Dragonborn
// `[{"str":2,"cha":1}]` (fixed only) vs Half-Elf
// `[{"cha":2,"choose":{"from":["str","dex","con","int","wis"],"count":2}}]`.
// A subrace's own bonuses (if any) ADD to the parent race's, both applied
// together when a subrace is chosen (e.g. Elf subraces layer their +1 on
// top of the base Elf's +2 Dex).

import type { AbilityKey } from '@/types/character';
import type { RaceAbilityBonus } from '@/types/reference';

const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export interface AbilityBonusChoiceClause {
  from: AbilityKey[];
  count: number;
}

export interface CombinedAbilityBonuses {
  fixed: Partial<Record<AbilityKey, number>>;
  choices: AbilityBonusChoiceClause[];
}

function isAbilityKey(value: string): value is AbilityKey {
  return (ABILITY_KEYS as string[]).includes(value);
}

export function combineAbilityBonuses(
  raceBonuses: RaceAbilityBonus[] | null,
  subraceBonuses: RaceAbilityBonus[] | null
): CombinedAbilityBonuses {
  const fixed: Partial<Record<AbilityKey, number>> = {};
  const choices: AbilityBonusChoiceClause[] = [];

  for (const entry of [...(raceBonuses ?? []), ...(subraceBonuses ?? [])]) {
    for (const key of ABILITY_KEYS) {
      const amount = entry[key];
      if (typeof amount === 'number') {
        fixed[key] = (fixed[key] ?? 0) + amount;
      }
    }
    if (entry.choose) {
      choices.push({
        from: entry.choose.from.filter(isAbilityKey),
        count: entry.choose.count,
      });
    }
  }

  return { fixed, choices };
}

// Total racial bonus for one ability, combining the fixed grant with
// whatever the player picked for any `choose` clause covering it.
export function getResolvedRacialBonus(
  combined: CombinedAbilityBonuses,
  choices: Partial<Record<AbilityKey, number>>,
  key: AbilityKey
): number {
  return (combined.fixed[key] ?? 0) + (choices[key] ?? 0);
}
