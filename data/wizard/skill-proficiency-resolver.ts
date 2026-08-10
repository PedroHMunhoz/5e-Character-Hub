// Parses the skill-proficiency DSL shared by classes
// (starting_proficiencies.skills) and backgrounds (skill_proficiencies).
// Confirmed live shapes:
// - Background: always a fixed grant, e.g. `[{"athletics":true,"intimidation":true}]`.
// - Class: either `[{"choose":{"from":[...],"count":N}}]` (pick N from a
//   restricted pool, e.g. Rogue) or `[{"any":N}]` (pick N from every skill,
//   e.g. Bard) - both confirmed live against the bundled db.

import { SKILL_KEY_BY_ENGLISH_NAME, SKILLS } from '@/constants/character';
import type { SkillKey } from '@/types/character';

const ALL_SKILL_KEYS: SkillKey[] = SKILLS.map((skill) => skill.key);

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
