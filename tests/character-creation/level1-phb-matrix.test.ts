// Exhaustive level-1 PHB character-creation regression suite. Covers EVERY
// race/sub-raça x classe/subclasse (only where the class grants one at
// level 1) x antecedente combination the PHB reference data supports,
// generated straight from the bundled database (tests/support/
// level1-matrix.ts) - not a hand-picked sample. Each case builds a fully
// resolved WizardDraft (tests/support/build-test-draft.ts, always picking
// the first valid option for any open choice) and calls the real
// assembleCharacter (data/wizard/assemble-character.ts) exactly as the
// wizard's "Detalhes" step does, with no UI/browser/emulator involved.
//
// See docs/testing.md for the full rationale, generation strategy, and how
// to extend this when new PHB data is added.
import type { SQLiteDatabase } from 'expo-sqlite';
import { afterAll, describe, expect, it } from 'vitest';

import { getClassById, getClassEnglishName, getSubclassById } from '@/data/queries/classes';
import { getRaceById } from '@/data/queries/races';
import { assembleCharacter } from '@/data/wizard/assemble-character';
import { getAbilityModifierFromTotal, getAbilityTotal } from '@/utils/ability-modifier';
import { getArmorClassBreakdown, getUnarmoredDefenseRule } from '@/utils/armor-class';
import type { CharacterClassDefinition, Race, SubclassDefinition } from '@/types/reference';
import { buildTestDraft } from '../support/build-test-draft';
import { buildLevel1Matrix, type Level1Combination } from '../support/level1-matrix';
import { openReferenceDb } from '../support/sqlite-adapter';

const db: SQLiteDatabase & { close(): void } = openReferenceDb();
const matrix: Level1Combination[] = await buildLevel1Matrix(db);

afterAll(() => {
  db.close();
});

// Small per-id caches - the matrix reuses the same class/subclass/race ids
// across thousands of combinations, so this avoids re-querying the same row
// over and over across the whole suite.
const classCache = new Map<number, CharacterClassDefinition | null>();
async function cachedClass(id: number): Promise<CharacterClassDefinition | null> {
  if (!classCache.has(id)) classCache.set(id, await getClassById(db, id));
  return classCache.get(id)!;
}
const subclassCache = new Map<number, SubclassDefinition | null>();
async function cachedSubclass(id: number): Promise<SubclassDefinition | null> {
  if (!subclassCache.has(id)) subclassCache.set(id, await getSubclassById(db, id));
  return subclassCache.get(id)!;
}
const raceCache = new Map<number, Race | null>();
async function cachedRace(id: number): Promise<Race | null> {
  if (!raceCache.has(id)) raceCache.set(id, await getRaceById(db, id));
  return raceCache.get(id)!;
}

describe('Criação de personagem nível 1 - matriz exaustiva PHB', () => {
  it('a matriz cobre toda combinação de raça/sub-raça x classe/subclasse x antecedente do PHB', () => {
    // 9 raças base + sub-raças/Humano Variante, todas as classes (com uma
    // linha por subclasse quando a classe concede subclasse já no nível 1),
    // todos os antecedentes - ver tests/support/level1-matrix.ts. O valor
    // exato de combinações vem inteiramente do banco; esta asserção só
    // garante que a matriz não ficou vazia por engano (ex.: um filtro
    // quebrado silenciosamente reduzindo tudo a zero).
    expect(matrix.length).toBeGreaterThan(1000);
  });

  it.each(matrix)('$label', async (combo) => {
    const draft = await buildTestDraft(db, combo);
    const character = await assembleCharacter(db, { draft, name: 'Personagem de Teste', appearance: {} });

    const classDef = await cachedClass(combo.classId);
    if (!classDef) throw new Error(`classe ${combo.classId} não encontrada`);

    // Referência: raça/classe/subclasse/antecedente escolhidos realmente
    // aparecem no personagem montado (nenhuma etapa "perdida" na
    // montagem).
    expect(character.raceId).toBe(combo.raceId);
    expect(character.subraceId).toBe(combo.subraceId);
    expect(character.backgroundId).toBe(combo.backgroundId);
    expect(character.classes[0].classId).toBe(combo.classId);
    expect(character.classes[0].subclassId).toBe(combo.subclassId);

    // PHB p.12 "Pontos de Vida no Nível 1": dado de vida cheio + modificador
    // de Constituição, no mínimo 1. Bônus conhecidos que se somam a isso:
    const conModifier = getAbilityModifierFromTotal(character.abilities.con) ?? 0;

    const subrace = combo.subraceId !== null ? await cachedRace(combo.subraceId) : null;
    // Robustez do Anão da Colina (PHB p.20): "+1 de PV, aumentando em 1
    // toda vez que ganha um nível" - +1 no nível 1.
    const isHillDwarf = subrace?.englishName === 'Hill';
    // Elfo Alto ("Cantrip", PHB p.24): truque do Mago à escolha, concedido
    // pela sub-raça independente da classe do personagem.
    const isHighElf = subrace?.englishName === 'High';

    const subclass = combo.subclassId !== null ? await cachedSubclass(combo.subclassId) : null;
    // Resiliência Dracônica do Feiticeiro Linhagem Dracônica (PHB p.101):
    // "+1 de PV agora, e mais 1 sempre que subir de nível de feiticeiro" -
    // +1 no nível 1.
    const isDraconicSorcerer = subclass?.shortName === 'Draconic';

    // Talento Durão (PHB p.171): "+2 pontos de vida por nível de
    // personagem" - lido de volta do personagem montado (o talento
    // realmente escolhido pelo auto-preenchedor, não presumido).
    const hasToughFeat = character.feats?.some((f) => f.englishName === 'Tough') ?? false;

    const expectedMaxHp = Math.max(
      1,
      (classDef.hitDieFaces ?? 8) +
        conModifier +
        (isDraconicSorcerer ? 1 : 0) +
        (isHillDwarf ? 1 : 0) +
        (hasToughFeat ? 2 : 0)
    );
    expect(Number(character.hitPoints.max)).toBe(expectedMaxHp);
    expect(character.hitPoints.current).toBe(character.hitPoints.max);

    // CA: assembleCharacter nunca equipa nada automaticamente (nenhum
    // inventoryItems recebe armorSlot/weaponSlot na montagem) - então a CA
    // de um personagem recém-criado é sempre a fórmula "sem armadura",
    // igual ao que app/components/character/character-sheet.tsx calcula
    // para esse mesmo estado. Base 10 + DES para a maioria; Bárbaro/Monge
    // (Defesa sem Armadura, PHB p.46/78) e Feiticeiro Linhagem Dracônica
    // (Resiliência Dracônica, PHB p.101) substituem essa fórmula.
    const dexModifier = getAbilityModifierFromTotal(character.abilities.dex) ?? 0;
    const wisModifier = getAbilityModifierFromTotal(character.abilities.wis) ?? 0;
    const classEnglishName = await getClassEnglishNameCached(combo.classId);
    const unarmoredDefenseRule = getUnarmoredDefenseRule(classEnglishName, subclass?.shortName ?? null, {
      con: String(getAbilityTotal(character.abilities.con)),
      wis: String(getAbilityTotal(character.abilities.wis)),
    });
    const expectedBaseAC =
      classEnglishName === 'Barbarian'
        ? 10 + dexModifier + conModifier
        : classEnglishName === 'Monk'
          ? 10 + dexModifier + wisModifier
          : isDraconicSorcerer
            ? 13 + dexModifier
            : 10 + dexModifier;
    const breakdown = getArmorClassBreakdown(
      String(getAbilityTotal(character.abilities.dex)),
      [],
      character.fightingStyle ?? null,
      unarmoredDefenseRule
    );
    expect(breakdown.total).toBe(expectedBaseAC);

    // Salvaguardas: exatamente as proficiências fixas da classe, mais
    // Resiliente (PHB p.170) quando esse foi o talento escolhido.
    const resilientAbility = character.feats?.find((f) => f.englishName === 'Resilient')?.abilityChoice ?? null;
    const expectedSavingThrows = new Set([...(classDef.savingThrowProficiencies ?? [])]);
    if (resilientAbility) expectedSavingThrows.add(resilientAbility);
    for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
      expect(character.savingThrows[key].proficient).toBe(expectedSavingThrows.has(key));
    }

    // Toda pontuação de atributo tem um total numérico plausível (o método
    // usado pelo auto-preenchedor é sempre o array padrão 15/14/13/12/10/8 +
    // bônus racial/de talento - nunca fica sem valor).
    for (const key of ['str', 'dex', 'con', 'int', 'wis', 'cha'] as const) {
      const total = getAbilityTotal(character.abilities[key]);
      expect(total).not.toBeNull();
      expect(total as number).toBeGreaterThanOrEqual(3);
      expect(total as number).toBeLessThanOrEqual(20);
    }

    // Elfo Alto ("Cantrip", PHB p.24): sempre ganha o truque bônus escolhido
    // no wizard além de tudo que a própria classe concede - cobre tanto o
    // caso conjurador quanto o não-conjurador (ex. Elfo Alto Guerreiro), já
    // que a matriz cruza Elfo Alto com toda classe. Comparado contra
    // draft.highElfCantripId/spellIds (não uma lista de truques do Mago
    // recalculada) porque vários truques são compartilhados entre listas de
    // classe (ex. Luz, Mão Mágica) - contar coincidências desse jeito daria
    // falso positivo pra classes não-Mago que também pegam um desses.
    if (isHighElf) {
      expect(draft.highElfCantripId).not.toBeNull();
      expect(character.spells[String(draft.highElfCantripId)]).toEqual({ prepared: true });
      expect(Object.keys(character.spells)).toHaveLength(draft.spellIds.length + 1);
    }
  });
});

const classEnglishNameCache = new Map<number, string | null>();
async function getClassEnglishNameCached(classId: number): Promise<string | null> {
  if (!classEnglishNameCache.has(classId)) {
    classEnglishNameCache.set(classId, await getClassEnglishName(db, classId));
  }
  return classEnglishNameCache.get(classId)!;
}
