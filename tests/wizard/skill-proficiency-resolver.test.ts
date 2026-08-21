// Direct unit tests for data/wizard/skill-proficiency-resolver.ts - no DB.
// resolveSkillChoicePool was only incidentally exercised before this file
// (called by tests/support/build-test-draft.ts, never asserted directly).
import { describe, expect, it } from 'vitest';

import {
  ALL_SKILL_KEYS,
  parseBackgroundSkillProficiencies,
  parseClassSkillChoice,
  resolveSkillChoicePool,
  type SkillChoiceClause,
} from '@/data/wizard/skill-proficiency-resolver';

describe('parseBackgroundSkillProficiencies', () => {
  it('extrai as perícias marcadas true (fixo de antecedente)', () => {
    expect(parseBackgroundSkillProficiencies([{ athletics: true, intimidation: true }])).toEqual([
      'atletismo',
      'intimidacao',
    ]);
  });

  it('ignora entradas marcadas false ou nomes desconhecidos', () => {
    expect(parseBackgroundSkillProficiencies([{ athletics: false, 'not a skill': true }])).toEqual([]);
  });
});

describe('parseClassSkillChoice', () => {
  it('forma "choose": lista restrita + quantidade (ex. Ladino)', () => {
    const result = parseClassSkillChoice([{ choose: { from: ['athletics', 'stealth'], count: 4 } }]);
    expect(result).toEqual({ from: ['atletismo', 'furtividade'], count: 4 });
  });

  it('forma "any": qualquer perícia (ex. Bardo)', () => {
    const result = parseClassSkillChoice([{ any: 3 }]);
    expect(result).toEqual({ from: ALL_SKILL_KEYS, count: 3 });
  });

  it('sem cláusula de escolha retorna null', () => {
    expect(parseClassSkillChoice([])).toBeNull();
    expect(parseClassSkillChoice(null)).toBeNull();
  });
});

describe('resolveSkillChoicePool', () => {
  it('remove perícias já concedidas por outra fonte da lista restrita', () => {
    const clause = { from: ['atletismo', 'furtividade', 'intimidacao'] as const, count: 2 };
    const result = resolveSkillChoicePool({ from: [...clause.from], count: clause.count }, ['atletismo']);
    expect(result).toEqual({ from: ['furtividade', 'intimidacao'], count: 2 });
  });

  it('PHB p.127: se a lista restrita ficar sem opções suficientes, abre pra qualquer perícia não concedida', () => {
    const clause: SkillChoiceClause = { from: ['atletismo', 'furtividade'], count: 2 };
    const result = resolveSkillChoicePool(clause, ['atletismo']);
    expect(result.count).toBe(2);
    expect(result.from).not.toContain('atletismo');
    expect(result.from.length).toBeGreaterThanOrEqual(2);
    expect(result.from).toEqual(ALL_SKILL_KEYS.filter((key) => key !== 'atletismo'));
  });

  it('lista restrita com opções suficientes não é substituída', () => {
    const clause: SkillChoiceClause = { from: ['atletismo', 'furtividade', 'intimidacao'], count: 2 };
    const result = resolveSkillChoicePool(clause, []);
    expect(result).toEqual({ from: ['atletismo', 'furtividade', 'intimidacao'], count: 2 });
  });
});
