// Parses the skill-proficiency DSL shared by classes
// (starting_proficiencies.skills) and backgrounds (skill_proficiencies).
// Confirmed live shapes:
// - Background: always a fixed grant, e.g. `[{"athletics":true,"intimidation":true}]`.
// - Class: either `[{"choose":{"from":[...],"count":N}}]` (pick N from a
//   restricted pool, e.g. Rogue) or `[{"any":N}]` (pick N from every skill,
//   e.g. Bard) - both confirmed live against the bundled db.

import { SKILL_KEY_BY_ENGLISH_NAME, SKILLS } from '@/constants/character';
import type { SkillKey } from '@/types/character';

export const ALL_SKILL_KEYS: SkillKey[] = SKILLS.map((skill) => skill.key);

function toSkillKey(englishName: string): SkillKey | null {
  return SKILL_KEY_BY_ENGLISH_NAME[englishName] ?? null;
}

export function parseBackgroundSkillProficiencies(raw: unknown): SkillKey[] {
  const groups = (raw as Record<string, boolean>[] | null) ?? [];
  const keys: SkillKey[] = [];
  for (const group of groups) {
    for (const [name, granted] of Object.entries(group)) {
      if (!granted) continue;
      const key = toSkillKey(name);
      if (key) keys.push(key);
    }
  }
  return keys;
}

export interface SkillChoiceClause {
  from: SkillKey[];
  count: number;
}

type RawClassSkills = ({ choose?: { from: string[]; count: number } } & { any?: number })[];

export function parseClassSkillChoice(raw: unknown): SkillChoiceClause | null {
  const groups = (raw as RawClassSkills | null) ?? [];
  for (const group of groups) {
    if (group.choose) {
      return { from: group.choose.from.map(toSkillKey).filter((key): key is SkillKey => key !== null), count: group.choose.count };
    }
    if (typeof group.any === 'number') {
      return { from: ALL_SKILL_KEYS, count: group.any };
    }
  }
  return null;
}

// PHB p.127 ("Proficiências"): "Caso um personagem venha a receber a mesma
// proficiência de duas fontes diferentes, ao invés disso ele pode escolher
// outra proficiência do mesmo tipo (perícia ou ferramenta)." Removing
// already-granted skills from `clause.from` implements that swap as long as
// enough options remain. If the restricted list runs dry (e.g. Cleric's
// 5-skill list after background/race overlap leaves fewer than `count`
// options), the class's own list stops being a meaningful restriction - so
// open up every not-yet-granted skill instead of forcing in a single
// arbitrary extra option (which would always be the same skill, since
// there'd be nothing to distinguish one "filler" pick from another).
export function resolveSkillChoicePool(clause: SkillChoiceClause, alreadyGranted: SkillKey[]): SkillChoiceClause {
  const granted = new Set(alreadyGranted);
  const from = clause.from.filter((key) => !granted.has(key));
  if (from.length >= clause.count) return { from, count: clause.count };
  return { from: ALL_SKILL_KEYS.filter((key) => !granted.has(key)), count: clause.count };
}
