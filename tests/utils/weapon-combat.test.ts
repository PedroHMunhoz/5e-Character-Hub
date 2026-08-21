// Direct unit tests for utils/weapon-combat.ts - no DB, hand-built weapon/
// context fixtures, same "extracted, DB-free" shape as
// tests/wizard/item-purchase.test.ts. Covers the PHB rules this module
// encodes: Finesse picks the better of STR/DEX (p.147); a versatile
// weapon's damage die only changes when actually wielded two-handed
// (p.147); the two-weapon-fighting off-hand attack only exists when both
// equipped weapons are Light (p.195), and only adds a *negative* ability
// modifier to damage unless the "Two-Weapon Fighting" Fighting Style is
// active (p.195); the "Dueling" style's +2 damage only applies to a
// one-handed melee weapon with no other weapon equipped (p.72); the
// "Archery" style's +2 attack only applies to ranged weapons (p.72); and
// the attack roll's proficiency bonus is gated on actually being
// proficient with the weapon.
import { describe, expect, it } from 'vitest';

import {
  getWeaponAbilityModifier,
  getWeaponAttackAndDamage,
  type WeaponAttackContext,
  type WeaponAttackDamageItem,
} from '@/utils/weapon-combat';

describe('getWeaponAbilityModifier', () => {
  it('usa Força para armas de Força', () => {
    expect(getWeaponAbilityModifier('str', '16', '10')).toBe(3);
  });

  it('usa Destreza para armas de Destreza', () => {
    expect(getWeaponAbilityModifier('dex', '10', '16')).toBe(3);
  });

  it('Acuidade escolhe o maior entre Força e Destreza', () => {
    expect(getWeaponAbilityModifier('finesse', '16', '10')).toBe(3);
    expect(getWeaponAbilityModifier('finesse', '10', '16')).toBe(3);
  });
});

// PHB Light property: dagger and handaxe are Light; longsword and shortbow
// are not (versatile/ammunition+two-handed respectively, no Light) -
// matches the real PHB weapon table, so these fixtures also double as
// realistic isLight cases for the two-weapon-fighting tests below.
const versatileLongsword: WeaponAttackDamageItem = {
  attackAbility: 'str',
  isRanged: false,
  weaponCategory: 'martial',
  damageDice: '1d8',
  damageDiceVersatile: '1d10',
  itemProficiencyKey: 'base_items:longsword',
  isLight: false,
};

const nonVersatileDagger: WeaponAttackDamageItem = {
  attackAbility: 'finesse',
  isRanged: false,
  weaponCategory: 'simple',
  damageDice: '1d4',
  itemProficiencyKey: 'base_items:dagger',
  isLight: true,
};

const rangedShortbow: WeaponAttackDamageItem = {
  attackAbility: 'dex',
  isRanged: true,
  weaponCategory: 'simple',
  damageDice: '1d6',
  itemProficiencyKey: 'base_items:shortbow',
  isLight: false,
};

// A plain 'str' weapon (not 'finesse' like the dagger above) - needed to
// actually exercise a negative ability modifier for the off-hand test,
// since 'finesse' would otherwise pick the character's (positive) Strength
// modifier instead.
const offHandHandaxe: WeaponAttackDamageItem = {
  attackAbility: 'str',
  isRanged: false,
  weaponCategory: 'simple',
  damageDice: '1d6',
  itemProficiencyKey: 'base_items:handaxe',
  isLight: true,
};

const baseContext: WeaponAttackContext = {
  slot: 'main',
  strScore: '16',
  dexScore: '10',
  proficiencyBonus: 2,
  fightingStyle: null,
  hasAnyOtherWeapon: false,
  hasMainHandCompanion: false,
  // Defaults to the "both weapons Light" happy path - the off-hand tests
  // below already pair this with a Light weapon (offHandHandaxe/dagger);
  // the dedicated "Leve" describe block overrides this to false to cover
  // the gate itself.
  mainHandWeaponIsLight: true,
  useMonkDex: false,
  weaponProficiencies: { categories: ['martial', 'simple'], items: [] },
};

describe('getWeaponAttackAndDamage - dado de dano versátil', () => {
  it('usa o dado de uma mão quando não empunhada com as duas mãos', () => {
    const result = getWeaponAttackAndDamage(versatileLongsword, { ...baseContext, slot: 'main' });
    expect(result.damageDice).toBe('1d8');
  });

  it('troca para o dado de duas mãos quando o slot é "twoHanded"', () => {
    const result = getWeaponAttackAndDamage(versatileLongsword, { ...baseContext, slot: 'twoHanded' });
    expect(result.damageDice).toBe('1d10');
  });

  it('uma arma não versátil mantém o mesmo dado em qualquer slot', () => {
    const oneHanded = getWeaponAttackAndDamage(nonVersatileDagger, { ...baseContext, slot: 'main' });
    const twoHanded = getWeaponAttackAndDamage(nonVersatileDagger, { ...baseContext, slot: 'twoHanded' });
    expect(oneHanded.damageDice).toBe('1d4');
    expect(twoHanded.damageDice).toBe('1d4');
  });
});

describe('getWeaponAttackAndDamage - penalidade de mão secundária', () => {
  it('só soma o modificador de habilidade ao dano se ele for negativo', () => {
    const negativeMod = getWeaponAttackAndDamage(offHandHandaxe, {
      ...baseContext,
      slot: 'off',
      strScore: '8',
      hasMainHandCompanion: true,
    });
    expect(negativeMod.isOffHandAttack).toBe(true);
    expect(negativeMod.damageModifier).toBe(-1);

    const positiveMod = getWeaponAttackAndDamage(offHandHandaxe, {
      ...baseContext,
      slot: 'off',
      hasMainHandCompanion: true,
    });
    expect(positiveMod.damageModifier).toBe(0);
  });

  it('soma o modificador inteiro com o Estilo de Luta "Combate com Duas Armas"', () => {
    const result = getWeaponAttackAndDamage(offHandHandaxe, {
      ...baseContext,
      slot: 'off',
      hasMainHandCompanion: true,
      fightingStyle: 'Two-Weapon Fighting',
    });
    expect(result.damageModifier).toBe(3);
  });

  it('não é tratado como ataque de mão secundária se não há arma companheira na mão principal', () => {
    const result = getWeaponAttackAndDamage(offHandHandaxe, {
      ...baseContext,
      slot: 'off',
      hasMainHandCompanion: false,
    });
    expect(result.isOffHandAttack).toBe(false);
    expect(result.damageModifier).toBe(3);
  });
});

describe('getWeaponAttackAndDamage - Combate com Duas Armas exige Leve nas duas mãos', () => {
  it('aplica a penalidade normalmente quando as duas armas são Leves', () => {
    const result = getWeaponAttackAndDamage(offHandHandaxe, {
      ...baseContext,
      slot: 'off',
      hasMainHandCompanion: true,
      mainHandWeaponIsLight: true,
    });
    expect(result.isOffHandAttack).toBe(true);
  });

  it('não conta como ataque de mão secundária se a arma da mão secundária não é Leve', () => {
    const result = getWeaponAttackAndDamage(versatileLongsword, {
      ...baseContext,
      slot: 'off',
      hasMainHandCompanion: true,
      mainHandWeaponIsLight: true,
    });
    expect(result.isOffHandAttack).toBe(false);
    expect(result.damageModifier).toBe(3);
  });

  it('não conta como ataque de mão secundária se a arma da mão principal não é Leve', () => {
    const result = getWeaponAttackAndDamage(offHandHandaxe, {
      ...baseContext,
      slot: 'off',
      hasMainHandCompanion: true,
      mainHandWeaponIsLight: false,
    });
    expect(result.isOffHandAttack).toBe(false);
    expect(result.damageModifier).toBe(3);
  });
});

describe('getWeaponAttackAndDamage - Estilo de Luta "Duelo"', () => {
  it('soma +2 de dano com arma corpo-a-corpo de uma mão e nenhuma outra arma equipada', () => {
    const result = getWeaponAttackAndDamage(nonVersatileDagger, {
      ...baseContext,
      fightingStyle: 'Dueling',
      hasAnyOtherWeapon: false,
    });
    expect(result.damageModifier).toBe(3 + 2);
  });

  it('não se aplica com arma à distância', () => {
    const result = getWeaponAttackAndDamage(rangedShortbow, {
      ...baseContext,
      dexScore: '16',
      fightingStyle: 'Dueling',
      hasAnyOtherWeapon: false,
    });
    expect(result.damageModifier).toBe(3);
  });

  it('não se aplica empunhando de duas mãos', () => {
    const result = getWeaponAttackAndDamage(versatileLongsword, {
      ...baseContext,
      slot: 'twoHanded',
      fightingStyle: 'Dueling',
      hasAnyOtherWeapon: false,
    });
    expect(result.damageModifier).toBe(3);
  });

  it('não se aplica se há outra arma equipada', () => {
    const result = getWeaponAttackAndDamage(nonVersatileDagger, {
      ...baseContext,
      fightingStyle: 'Dueling',
      hasAnyOtherWeapon: true,
    });
    expect(result.damageModifier).toBe(3);
  });
});

describe('getWeaponAttackAndDamage - Estilo de Luta "Pontaria"', () => {
  it('soma +2 de ataque só com arma à distância', () => {
    const ranged = getWeaponAttackAndDamage(rangedShortbow, {
      ...baseContext,
      dexScore: '16',
      fightingStyle: 'Archery',
    });
    const melee = getWeaponAttackAndDamage(nonVersatileDagger, { ...baseContext, fightingStyle: 'Archery' });

    expect(ranged.attackBonus).toBe(3 + 2 + 2);
    expect(melee.attackBonus).toBe(3 + 2);
  });
});

describe('getWeaponAttackAndDamage - proficiência', () => {
  it('soma o bônus de proficiência quando a categoria da arma é proficiente', () => {
    const result = getWeaponAttackAndDamage(versatileLongsword, baseContext);
    expect(result.isProficient).toBe(true);
    expect(result.attackBonus).toBe(3 + 2);
  });

  it('soma o bônus de proficiência quando o item específico é proficiente, mesmo fora da categoria', () => {
    const result = getWeaponAttackAndDamage(
      { ...versatileLongsword, weaponCategory: undefined },
      { ...baseContext, weaponProficiencies: { categories: [], items: ['base_items:longsword'] } }
    );
    expect(result.isProficient).toBe(true);
  });

  it('não soma o bônus de proficiência sem proficiência', () => {
    const result = getWeaponAttackAndDamage(versatileLongsword, {
      ...baseContext,
      weaponProficiencies: { categories: [], items: [] },
    });
    expect(result.isProficient).toBe(false);
    expect(result.attackBonus).toBe(3);
  });

  it('Monge com arma de monge sempre conta como proficiente, mesmo sem a categoria', () => {
    const result = getWeaponAttackAndDamage(versatileLongsword, {
      ...baseContext,
      useMonkDex: true,
      weaponProficiencies: { categories: [], items: [] },
    });
    expect(result.isProficient).toBe(true);
  });
});

describe('getWeaponAttackAndDamage - Artes Marciais do Monge (DES no lugar de FOR)', () => {
  it('usa Acuidade (o maior de FOR/DES) quando useMonkDex está ativo', () => {
    const result = getWeaponAttackAndDamage(versatileLongsword, {
      ...baseContext,
      strScore: '10',
      dexScore: '16',
      useMonkDex: true,
    });
    expect(result.attackBonus).toBe(3 + 2);
  });
});
