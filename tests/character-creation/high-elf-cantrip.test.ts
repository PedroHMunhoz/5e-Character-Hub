// Casos do truque à escolha do Elfo Alto ("Cantrip", PHB p.24) que a matriz
// exaustiva (level1-phb-matrix.test.ts) não cobre - ela sempre auto-preenche
// via buildTestDraft, que já evita colisão entre o truque racial e os
// truques de classe, então a dedup em assembleCharacter nunca é exercitada
// lá. Ver data/wizard/assemble-character.ts e app/wizard/spells.tsx.
import type { SQLiteDatabase } from 'expo-sqlite';
import { afterAll, describe, expect, it } from 'vitest';

import { getAllBackgrounds } from '@/data/queries/backgrounds';
import { getAllClasses, getClassEnglishName } from '@/data/queries/classes';
import { getAllRaces } from '@/data/queries/races';
import { assembleCharacter } from '@/data/wizard/assemble-character';
import { buildTestDraft, type DraftInput } from '../support/build-test-draft';
import { openReferenceDb } from '../support/sqlite-adapter';

const db: SQLiteDatabase & { close(): void } = openReferenceDb();

afterAll(() => {
  db.close();
});

async function findClassId(englishName: string): Promise<number> {
  const classes = await getAllClasses(db);
  for (const classDef of classes) {
    if ((await getClassEnglishName(db, classDef.id)) === englishName) return classDef.id;
  }
  throw new Error(`classe "${englishName}" não encontrada`);
}

async function highElfInput(classId: number): Promise<DraftInput> {
  const races = await getAllRaces(db);
  const highElf = races.find((r) => r.englishName === 'High');
  if (!highElf || highElf.parentRaceId === null) {
    throw new Error('sub-raça Elfo Alto não encontrada na base de referência');
  }
  const [background] = await getAllBackgrounds(db);
  return {
    raceId: highElf.parentRaceId,
    subraceId: highElf.id,
    classId,
    subclassId: null,
    backgroundId: background.id,
  };
}

describe('Truque à escolha do Elfo Alto (Trello #45)', () => {
  it('Elfo Alto Mago ganha o truque racial além do seu próprio spellbook de classe', async () => {
    const wizardId = await findClassId('Wizard');
    const draft = await buildTestDraft(db, await highElfInput(wizardId));

    expect(draft.highElfCantripId).not.toBeNull();
    // O auto-preenchedor (mesma lógica da UI) nunca deixa o truque racial
    // colidir com os já escolhidos pela classe (3 truques + 6 magias de 1º
    // nível do spellbook inicial do Mago, PHB p.114).
    expect(draft.spellIds).not.toContain(draft.highElfCantripId);

    const character = await assembleCharacter(db, { draft, name: 'Personagem de Teste', appearance: {} });
    const spellIds = Object.keys(character.spells).map(Number);
    // Todo o spellbook da classe, mais exatamente 1 entrada extra (o truque
    // racial) - não duas classes se sobrescrevendo nem nada se perdendo.
    expect(spellIds).toHaveLength(draft.spellIds.length + 1);
    expect(spellIds).toContain(draft.highElfCantripId);
    expect(character.spells[String(draft.highElfCantripId)]).toEqual({ prepared: true });
  });

  it('Elfo Alto Guerreiro (não-conjurador) tem como escolher o truque e ganha só ele', async () => {
    const fighterId = await findClassId('Fighter');
    const draft = await buildTestDraft(db, await highElfInput(fighterId));

    // Antes desse card, um Guerreiro nunca teria spellIds preenchido (Passo 6
    // nem renderizava) - aqui confirmamos que ele segue vazio, e que o
    // truque racial é a ÚNICA fonte de magia dele.
    expect(draft.spellIds).toEqual([]);
    expect(draft.highElfCantripId).not.toBeNull();

    const character = await assembleCharacter(db, { draft, name: 'Personagem de Teste', appearance: {} });
    expect(Object.keys(character.spells)).toEqual([String(draft.highElfCantripId)]);
    expect(character.spells[String(draft.highElfCantripId)]).toEqual({ prepared: true });
  });

  it('não duplica quando o Mago escolhe pela classe o mesmo truque do bônus racial', async () => {
    const wizardId = await findClassId('Wizard');
    const draft = await buildTestDraft(db, await highElfInput(wizardId));
    const duplicatedCantripId = draft.spellIds[0];
    const duplicated = { ...draft, highElfCantripId: duplicatedCantripId };

    const character = await assembleCharacter(db, { draft: duplicated, name: 'Personagem de Teste', appearance: {} });

    // Continua com só os 3 truques/magias da classe - a escolha racial
    // duplicada não vira uma quarta entrada.
    expect(Object.keys(character.spells)).toHaveLength(draft.spellIds.length);
    // Mago começa com nada preparado (spellsKnownFixed + maxPreparedFormula,
    // ver SPELLCASTING_RULES.Wizard) - a entrada sobrevivente é a de classe,
    // não a racial (que seria prepared:true), já que o grant racial é
    // descartado inteiramente quando colide.
    expect(character.spells[String(duplicatedCantripId)]).toEqual({ prepared: false });
  });

  it('exige o truque de Alto Elfo antes de montar a ficha', async () => {
    const fighterId = await findClassId('Fighter');
    const draft = await buildTestDraft(db, await highElfInput(fighterId));
    const missingChoice = { ...draft, highElfCantripId: null };

    await expect(
      assembleCharacter(db, { draft: missingChoice, name: 'Personagem de Teste', appearance: {} })
    ).rejects.toThrow(/truque de Alto Elfo/);
  });
});
