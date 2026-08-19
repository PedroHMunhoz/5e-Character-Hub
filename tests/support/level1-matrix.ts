// Builds the exhaustive level-1 PHB combination matrix straight from the
// bundled reference database - every base race x subrace (including "no
// subrace" and Variant Human as their own entries), every class x subclass
// (only classes that grant a subclass at level 1 - see
// classGrantsSubclassAtLevel1 - get more than one row here), and every
// background. Nothing here is a hand-picked list: run this against a future
// db/import with more PHB races/classes/backgrounds and it grows on its own.
import type { SQLiteDatabase } from 'expo-sqlite';

import { getAllBackgrounds } from '@/data/queries/backgrounds';
import { classGrantsSubclassAtLevel1, getAllClasses, getSubclassesForClass } from '@/data/queries/classes';
import { getAllRaces } from '@/data/queries/races';

export interface RaceVariant {
  raceId: number;
  subraceId: number | null;
  label: string;
}

export interface ClassVariant {
  classId: number;
  subclassId: number | null;
  label: string;
}

export interface Level1Combination {
  raceId: number;
  subraceId: number | null;
  classId: number;
  subclassId: number | null;
  backgroundId: number;
  label: string;
}

export async function getRaceVariants(db: SQLiteDatabase): Promise<RaceVariant[]> {
  const races = await getAllRaces(db);
  const baseRaces = races.filter((r) => r.parentRaceId === null);
  const variants: RaceVariant[] = [];

  for (const base of baseRaces) {
    const subraces = races.filter((r) => r.parentRaceId === base.id && r.englishName !== 'Variant');
    if (subraces.length === 0) {
      variants.push({ raceId: base.id, subraceId: null, label: base.name });
    } else {
      for (const sub of subraces) {
        variants.push({ raceId: base.id, subraceId: sub.id, label: `${base.name} (${sub.name})` });
      }
    }
    // Variant Human (PHB p.31): a distinct build of Human, not one of
    // several subrace flavors - surfaced as its own top-level entry, same
    // as app/wizard/index.tsx's "Raça" combo.
    const variantHuman = races.find((r) => r.parentRaceId === base.id && r.englishName === 'Variant');
    if (variantHuman) {
      variants.push({ raceId: base.id, subraceId: variantHuman.id, label: `${base.name} (Variante)` });
    }
  }

  return variants;
}

export async function getClassVariants(db: SQLiteDatabase): Promise<ClassVariant[]> {
  const classes = await getAllClasses(db);
  const variants: ClassVariant[] = [];

  for (const classDef of classes) {
    const grantsSubclass = await classGrantsSubclassAtLevel1(db, classDef.id);
    if (!grantsSubclass) {
      variants.push({ classId: classDef.id, subclassId: null, label: classDef.name });
      continue;
    }
    const subclasses = await getSubclassesForClass(db, classDef.id);
    for (const subclass of subclasses) {
      variants.push({ classId: classDef.id, subclassId: subclass.id, label: `${classDef.name} (${subclass.name})` });
    }
  }

  return variants;
}

export async function buildLevel1Matrix(db: SQLiteDatabase): Promise<Level1Combination[]> {
  const [raceVariants, classVariants, backgrounds] = [
    await getRaceVariants(db),
    await getClassVariants(db),
    await getAllBackgrounds(db),
  ];

  const combinations: Level1Combination[] = [];
  for (const race of raceVariants) {
    for (const classVariant of classVariants) {
      for (const background of backgrounds) {
        combinations.push({
          raceId: race.raceId,
          subraceId: race.subraceId,
          classId: classVariant.classId,
          subclassId: classVariant.subclassId,
          backgroundId: background.id,
          label: `${race.label} + ${classVariant.label} + Antecedente ${background.name}`,
        });
      }
    }
  }

  return combinations;
}
