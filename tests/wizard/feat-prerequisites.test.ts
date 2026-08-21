// Direct unit tests for data/wizard/feat-prerequisites.ts - no DB. Only
// incidentally exercised before this file (used by tests/support/build-
// test-draft.ts to filter eligible feats for fixtures, never asserted
// directly against its own edge cases).
import { describe, expect, it } from 'vitest';

import { meetsFeatPrerequisite, type FeatPrerequisiteContext } from '@/data/wizard/feat-prerequisites';

const baseContext: FeatPrerequisiteContext = {
  abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  armorProficiencies: new Set(),
  canCastSpells: false,
};

describe('meetsFeatPrerequisite - sem pré-requisito', () => {
  it('sempre passa quando o talento não declara prerequisite', () => {
    expect(meetsFeatPrerequisite(null, baseContext)).toBe(true);
    expect(meetsFeatPrerequisite([], baseContext)).toBe(true);
  });
});

describe('meetsFeatPrerequisite - habilidade mínima', () => {
  it('passa quando a habilidade exigida atinge o mínimo', () => {
    const raw = [{ ability: [{ str: 13 }] }];
    expect(
      meetsFeatPrerequisite(raw, { ...baseContext, abilityScores: { ...baseContext.abilityScores, str: 13 } })
    ).toBe(true);
  });

  it('bloqueia quando fica abaixo do mínimo', () => {
    const raw = [{ ability: [{ str: 13 }] }];
    expect(meetsFeatPrerequisite(raw, baseContext)).toBe(false);
  });

  it('múltiplas entradas no array são OR (ex. Conjurador Ritual: Int 13 OU Sab 13)', () => {
    const raw = [{ ability: [{ int: 13 }, { wis: 13 }] }];
    expect(
      meetsFeatPrerequisite(raw, { ...baseContext, abilityScores: { ...baseContext.abilityScores, wis: 13 } })
    ).toBe(true);
    expect(meetsFeatPrerequisite(raw, baseContext)).toBe(false);
  });

  it('múltiplas chaves numa mesma entrada são AND', () => {
    const raw = [{ ability: [{ str: 13, dex: 13 }] }];
    expect(
      meetsFeatPrerequisite(raw, { ...baseContext, abilityScores: { ...baseContext.abilityScores, str: 13 } })
    ).toBe(false);
    expect(
      meetsFeatPrerequisite(raw, { ...baseContext, abilityScores: { ...baseContext.abilityScores, str: 13, dex: 13 } })
    ).toBe(true);
  });
});

describe('meetsFeatPrerequisite - proficiência de armadura', () => {
  it('passa quando o personagem já é proficiente com a categoria exigida', () => {
    const raw = [{ proficiency: [{ armor: 'medium' as const }] }];
    expect(meetsFeatPrerequisite(raw, { ...baseContext, armorProficiencies: new Set(['medium']) })).toBe(true);
  });

  it('bloqueia sem a proficiência', () => {
    const raw = [{ proficiency: [{ armor: 'medium' as const }] }];
    expect(meetsFeatPrerequisite(raw, baseContext)).toBe(false);
  });
});

describe('meetsFeatPrerequisite - conjuração', () => {
  it('passa quando o personagem tem uma característica de conjuração', () => {
    const raw = [{ spellcasting: true }];
    expect(meetsFeatPrerequisite(raw, { ...baseContext, canCastSpells: true })).toBe(true);
  });

  it('bloqueia sem conjuração', () => {
    const raw = [{ spellcasting: true }];
    expect(meetsFeatPrerequisite(raw, baseContext)).toBe(false);
  });
});

describe('meetsFeatPrerequisite - grupos combinados', () => {
  it('todos os grupos do array precisam passar (AND entre grupos)', () => {
    const raw = [{ ability: [{ str: 13 }] }, { spellcasting: true }];
    const meetsAbilityOnly = { ...baseContext, abilityScores: { ...baseContext.abilityScores, str: 13 } };
    expect(meetsFeatPrerequisite(raw, meetsAbilityOnly)).toBe(false);
    expect(meetsFeatPrerequisite(raw, { ...meetsAbilityOnly, canCastSpells: true })).toBe(true);
  });
});
