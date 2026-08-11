import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

import { getClassEnglishName, getSubclassById } from '@/data/queries/classes';
import { useCharacter } from './use-character';

export interface CharacterClassInfo {
  englishName: string | null;
  subclassShortName: string | null;
}

const EMPTY_INFO: CharacterClassInfo = { englishName: null, subclassShortName: null };

// Resolves the character's (single - no multiclass yet) class to its stable
// English identifier, plus its subclass's raw `shortName` when one was
// chosen - used to gate class-specific passive bonuses (Unarmored Defense,
// Unarmored Movement, Martial Arts, Draconic Resilience) without hardcoding
// against the localized display name. Same query + useEffect pattern
// already used inline in components/character/character-spells.tsx.
export function useCharacterClassInfo(): CharacterClassInfo {
  const db = useSQLiteContext();
  const { character } = useCharacter();
  const [info, setInfo] = useState<CharacterClassInfo>(EMPTY_INFO);

  useEffect(() => {
    const cls = character.classes[0];
    if (!cls?.classId) {
      setInfo(EMPTY_INFO);
      return;
    }
    let cancelled = false;
    Promise.all([
      getClassEnglishName(db, cls.classId),
      cls.subclassId != null ? getSubclassById(db, cls.subclassId) : Promise.resolve(null),
    ]).then(([englishName, subclass]) => {
      if (!cancelled) setInfo({ englishName, subclassShortName: subclass?.shortName ?? null });
    });
    return () => {
      cancelled = true;
    };
  }, [db, character.classes]);

  return info;
}
