// Validates a feat's `prerequisite` DSL (types/reference.ts's
// Feat.prerequisite) against the character-in-progress. Extracted every PHB
// feat prerequisite live (5e-2014-data/feats.json): only 12 of 42 feats have
// one, in exactly 3 shapes -
// - `ability`: array of {abilityKey: minScore} - multiple entries in the
//   array are OR'd (e.g. Ritual Caster: Int 13 OR Wis 13), multiple keys in
//   one entry would be AND'd (not used by any PHB feat, but handled anyway).
// - `proficiency`: array of {armor: category} - proficiency with that armor
//   category.
// - `spellcasting`: true - the character has a spellcasting feature.
// A feat with no `prerequisite` at all always passes.

import type { AbilityKey, ArmorCategory } from '@/types/character';

export interface FeatPrerequisiteContext {
  // Final totals (base + racial + any prior feat bonus), not base scores.
  abilityScores: Record<AbilityKey, number>;
  armorProficiencies: Set<ArmorCategory>;
  canCastSpells: boolean;
}

interface RawPrerequisiteGroup {
  ability?: Partial<Record<AbilityKey, number>>[];
  proficiency?: { armor?: ArmorCategory }[];
  spellcasting?: boolean;
}

export function meetsFeatPrerequisite(raw: unknown, context: FeatPrerequisiteContext): boolean {
  const groups = (raw as RawPrerequisiteGroup[] | null) ?? [];

  return groups.every((group) => {
    if (group.ability) {
      const meetsAny = group.ability.some((requirement) =>
        (Object.entries(requirement) as [AbilityKey, number][]).every(
          ([key, minimum]) => context.abilityScores[key] >= minimum
        )
      );
      if (!meetsAny) return false;
    }

    if (group.proficiency) {
      const meetsAny = group.proficiency.some(
        (requirement) => requirement.armor && context.armorProficiencies.has(requirement.armor)
      );
      if (!meetsAny) return false;
    }

    if (group.spellcasting && !context.canCastSpells) return false;

    return true;
  });
}
