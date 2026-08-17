import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { SelectField } from '@/components/character/select-field';
import { WizardStepHeader } from '@/components/wizard/wizard-step-header';
import { ThemedText } from '@/components/themed-text';
import {
  FAVORED_ENEMY_HUMANOID_KEY,
  FAVORED_ENEMY_HUMANOID_OPTION,
  FAVORED_ENEMY_HUMANOID_RACES,
  FAVORED_ENEMY_NO_LANGUAGE,
  FAVORED_ENEMY_TYPES,
  getFavoredEnemyTypeLanguages,
  getHumanoidRaceLanguages,
} from '@/constants/favored-enemy';
import { FAVORED_TERRAINS } from '@/constants/favored-terrain';
import { CLASS_INFO, formatAbilitySlot, type ClassInfo } from '@/constants/class-info';
import { SUBCLASS_INFO } from '@/constants/subclass-info';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useWizardDraft } from '@/context/wizard-context';
import {
  classGrantsFavoredEnemyAtLevel1,
  classGrantsFavoredTerrainAtLevel1,
  classGrantsFightingStyleAtLevel1,
  classGrantsSubclassAtLevel1,
  getAllClasses,
  getClassEnglishName,
  getSubclassesForClass,
} from '@/data/queries/classes';
import { getAllLanguages, type Language } from '@/data/queries/languages';
import { getFightingStyleOptions } from '@/data/queries/optional-features';
import { sortByLocalizedName, subclassSortKey } from '@/utils/sort-by-name';
import type { CharacterClassDefinition, OptionalFeatureDefinition, SubclassDefinition } from '@/types/reference';

export default function WizardClassStep() {
  const db = useSQLiteContext();
  const router = useRouter();
  const {
    draft,
    setClass,
    setSubclass,
    setFightingStyle,
    setFavoredEnemyType,
    setFavoredEnemyHumanoidRaces,
    setFavoredTerrain,
    setFavoredEnemyLanguage,
  } = useWizardDraft();
  const goldColor = useThemeColor({}, 'gold');

  const [classes, setClasses] = useState<CharacterClassDefinition[] | null>(null);
  const [subclasses, setSubclasses] = useState<SubclassDefinition[] | null>(null);
  const [needsSubclassChoice, setNeedsSubclassChoice] = useState(false);
  const [fightingStyles, setFightingStyles] = useState<OptionalFeatureDefinition[] | null>(null);
  const [needsFightingStyle, setNeedsFightingStyle] = useState(false);
  const [needsFavoredEnemy, setNeedsFavoredEnemy] = useState(false);
  const [needsFavoredTerrain, setNeedsFavoredTerrain] = useState(false);
  const [languages, setLanguages] = useState<Language[] | null>(null);
  const [classEnglishName, setClassEnglishName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAllClasses(db).then((data) => {
      if (!cancelled) setClasses(sortByLocalizedName(data));
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  useEffect(() => {
    if (draft.classId === null) {
      setClassEnglishName(null);
      return;
    }
    let cancelled = false;
    getClassEnglishName(db, draft.classId).then((name) => {
      if (!cancelled) setClassEnglishName(name);
    });
    return () => {
      cancelled = true;
    };
  }, [db, draft.classId]);

  useEffect(() => {
    if (draft.classId === null) {
      setSubclasses(null);
      setNeedsSubclassChoice(false);
      return;
    }
    let cancelled = false;
    classGrantsSubclassAtLevel1(db, draft.classId).then(async (grantsNow) => {
      if (cancelled) return;
      setNeedsSubclassChoice(grantsNow);
      if (!grantsNow) {
        setSubclasses(null);
        return;
      }
      const data = await getSubclassesForClass(db, draft.classId!);
      if (!cancelled) setSubclasses(sortByLocalizedName(data, (s) => subclassSortKey(s.name)));
    });
    return () => {
      cancelled = true;
    };
  }, [db, draft.classId]);

  useEffect(() => {
    if (draft.classId === null) {
      setFightingStyles(null);
      setNeedsFightingStyle(false);
      return;
    }
    let cancelled = false;
    classGrantsFightingStyleAtLevel1(db, draft.classId).then(async (grantsNow) => {
      if (cancelled) return;
      setNeedsFightingStyle(grantsNow);
      if (!grantsNow) {
        setFightingStyles(null);
        return;
      }
      const data = await getFightingStyleOptions(db);
      if (!cancelled) setFightingStyles(sortByLocalizedName(data));
    });
    return () => {
      cancelled = true;
    };
  }, [db, draft.classId]);

  useEffect(() => {
    if (draft.classId === null) {
      setNeedsFavoredEnemy(false);
      setNeedsFavoredTerrain(false);
      return;
    }
    let cancelled = false;
    // Sequential, not Promise.all - overlapping queries on the same
    // SQLiteDatabase connection can crash on native (see
    // data/queries/character-features.ts).
    classGrantsFavoredEnemyAtLevel1(db, draft.classId).then(async (grantsFavoredEnemy) => {
      if (cancelled) return;
      setNeedsFavoredEnemy(grantsFavoredEnemy);
      const grantsFavoredTerrain = await classGrantsFavoredTerrainAtLevel1(db, draft.classId!);
      if (!cancelled) setNeedsFavoredTerrain(grantsFavoredTerrain);
    });
    return () => {
      cancelled = true;
    };
  }, [db, draft.classId]);

  useEffect(() => {
    if (!needsFavoredEnemy) {
      setLanguages(null);
      return;
    }
    let cancelled = false;
    getAllLanguages(db).then((data) => {
      if (!cancelled) setLanguages(data);
    });
    return () => {
      cancelled = true;
    };
  }, [db, needsFavoredEnemy]);

  const isHumanoidFavoredEnemy = draft.favoredEnemyType === FAVORED_ENEMY_HUMANOID_KEY;

  // Resolves each language slot as soon as its type/race settles - a slot
  // with zero or one possible language locks immediately (there's nothing
  // truthful to choose between); a slot with 2+ (only 'fiend' today)
  // defaults to the first option but stays player-editable, see
  // FavoredEnemyLanguageField below. Only fills while the slot is still
  // null, so it never overwrites a choice the player already made among 2+
  // options. Resets to null (and so re-resolves) whenever the underlying
  // type/race changes - see SET_FAVORED_ENEMY_TYPE/
  // SET_FAVORED_ENEMY_HUMANOID_RACES in context/wizard-context.tsx.
  useEffect(() => {
    if (languages === null) return;
    const resolvedLanguages = languages;

    function resolveSlot(slot: 0 | 1, hasSelection: boolean, possibleNames: string[]) {
      if (!hasSelection || draft.favoredEnemyLanguageIds[slot] !== null) return;
      if (possibleNames.length === 0) {
        setFavoredEnemyLanguage(slot, FAVORED_ENEMY_NO_LANGUAGE);
        return;
      }
      const first = resolveLanguageMatches(possibleNames, resolvedLanguages)[0];
      if (first) setFavoredEnemyLanguage(slot, first.id);
    }

    if (isHumanoidFavoredEnemy) {
      resolveSlot(
        0,
        draft.favoredEnemyHumanoidRaces[0] !== null,
        getHumanoidRaceLanguages(draft.favoredEnemyHumanoidRaces[0])
      );
      resolveSlot(
        1,
        draft.favoredEnemyHumanoidRaces[1] !== null,
        getHumanoidRaceLanguages(draft.favoredEnemyHumanoidRaces[1])
      );
    } else {
      resolveSlot(0, draft.favoredEnemyType !== null, getFavoredEnemyTypeLanguages(draft.favoredEnemyType));
    }
  }, [
    languages,
    isHumanoidFavoredEnemy,
    draft.favoredEnemyType,
    draft.favoredEnemyHumanoidRaces,
    draft.favoredEnemyLanguageIds,
    setFavoredEnemyLanguage,
  ]);

  const selectedClass = useMemo(
    () => (classes ?? []).find((c) => c.id === draft.classId) ?? null,
    [classes, draft.classId]
  );
  const classInfo = classEnglishName ? (CLASS_INFO[classEnglishName] ?? null) : null;
  const selectedSubclass = useMemo(
    () => (subclasses ?? []).find((s) => s.id === draft.subclassId) ?? null,
    [subclasses, draft.subclassId]
  );
  const subclassInfo =
    classEnglishName && selectedSubclass
      ? (SUBCLASS_INFO[classEnglishName]?.[selectedSubclass.shortName] ?? null)
      : null;
  const selectedFightingStyle = useMemo(
    () => (fightingStyles ?? []).find((f) => f.id === draft.fightingStyleId) ?? null,
    [fightingStyles, draft.fightingStyleId]
  );
  const selectedFavoredEnemy = useMemo(
    () => [...FAVORED_ENEMY_TYPES, FAVORED_ENEMY_HUMANOID_OPTION].find((o) => o.key === draft.favoredEnemyType) ?? null,
    [draft.favoredEnemyType]
  );
  const selectedHumanoidRace0 = useMemo(
    () => FAVORED_ENEMY_HUMANOID_RACES.find((r) => r.key === draft.favoredEnemyHumanoidRaces[0]) ?? null,
    [draft.favoredEnemyHumanoidRaces]
  );
  const selectedHumanoidRace1 = useMemo(
    () => FAVORED_ENEMY_HUMANOID_RACES.find((r) => r.key === draft.favoredEnemyHumanoidRaces[1]) ?? null,
    [draft.favoredEnemyHumanoidRaces]
  );
  const selectedFavoredTerrain = useMemo(
    () => FAVORED_TERRAINS.find((o) => o.key === draft.favoredTerrainType) ?? null,
    [draft.favoredTerrainType]
  );

  // Combos with a fixed option list (not fetched/pre-sorted from the DB like
  // classes/subclasses/fighting styles above) need their own alphabetical
  // sort - same rule as DRACONIC_ANCESTRIES in app/wizard/index.tsx: sort by
  // the pt-BR label, never by insertion order, since that order will shift
  // once other locales exist.
  const sortedFavoredEnemyOptions = useMemo(
    () =>
      [...FAVORED_ENEMY_TYPES, FAVORED_ENEMY_HUMANOID_OPTION].sort((a, b) =>
        a.labelPt.localeCompare(b.labelPt, 'pt-BR')
      ),
    []
  );
  const sortedHumanoidRaces = useMemo(
    () => [...FAVORED_ENEMY_HUMANOID_RACES].sort((a, b) => a.labelPt.localeCompare(b.labelPt, 'pt-BR')),
    []
  );
  const sortedFavoredTerrains = useMemo(
    () => [...FAVORED_TERRAINS].sort((a, b) => a.labelPt.localeCompare(b.labelPt, 'pt-BR')),
    []
  );

  const favoredEnemyLanguagesResolved = isHumanoidFavoredEnemy
    ? draft.favoredEnemyLanguageIds[0] !== null && draft.favoredEnemyLanguageIds[1] !== null
    : draft.favoredEnemyLanguageIds[0] !== null;

  const canProceed =
    draft.classId !== null &&
    (!needsSubclassChoice || draft.subclassId !== null) &&
    (!needsFightingStyle || draft.fightingStyleId !== null) &&
    (!needsFavoredEnemy ||
      (draft.favoredEnemyType !== null &&
        (!isHumanoidFavoredEnemy ||
          (draft.favoredEnemyHumanoidRaces[0] !== null && draft.favoredEnemyHumanoidRaces[1] !== null)) &&
        favoredEnemyLanguagesResolved)) &&
    (!needsFavoredTerrain || draft.favoredTerrainType !== null);

  if (classes === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={goldColor} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <WizardStepHeader step={2} title="Classe" subtitle="Escolha a classe do seu personagem." />

        <SelectField
          label="Classe"
          value={draft.classId !== null ? String(draft.classId) : ''}
          options={classes.map((c) => ({ value: String(c.id), label: c.name }))}
          onChange={(value) => setClass(Number(value))}
        />

        {classInfo ? (
          <View style={[styles.field, { borderColor: goldColor }]}>
            <ThemedText style={styles.descriptionParagraph}>{classInfo.description['pt-BR']}</ThemedText>
            <ThemedText style={styles.descriptionParagraph}>{formatPrimaryAbilities(classInfo)}</ThemedText>
          </View>
        ) : null}

        {needsSubclassChoice && subclasses ? (
          <SelectField
            label={selectedClass?.subclassTitle ?? 'Subclasse'}
            value={draft.subclassId !== null ? String(draft.subclassId) : ''}
            options={subclasses.map((s) => ({ value: String(s.id), label: s.name }))}
            onChange={(value) => setSubclass(Number(value))}
          />
        ) : null}

        {subclassInfo ? (
          <View style={[styles.field, { borderColor: goldColor }]}>
            <ThemedText style={styles.descriptionParagraph}>{subclassInfo['pt-BR']}</ThemedText>
          </View>
        ) : null}

        {needsFavoredEnemy ? (
          <>
            <SelectField
              label="Inimigo Favorito"
              value={draft.favoredEnemyType ?? ''}
              options={sortedFavoredEnemyOptions.map((o) => ({ value: o.key, label: o.labelPt }))}
              onChange={(value) => setFavoredEnemyType(value)}
            />
            {selectedFavoredEnemy ? (
              <View style={[styles.field, { borderColor: goldColor }]}>
                <ThemedText style={styles.descriptionParagraph}>{selectedFavoredEnemy.blurbPt}</ThemedText>
              </View>
            ) : null}

            {!isHumanoidFavoredEnemy && selectedFavoredEnemy ? (
              <FavoredEnemyLanguageField
                label="Idioma do Inimigo"
                possibleLanguageNames={getFavoredEnemyTypeLanguages(draft.favoredEnemyType)}
                languages={languages ?? []}
                value={draft.favoredEnemyLanguageIds[0]}
                onChange={(value) => setFavoredEnemyLanguage(0, value)}
              />
            ) : null}

            {isHumanoidFavoredEnemy ? (
              <>
                <SelectField
                  label="Primeira Raça Humanoide"
                  value={draft.favoredEnemyHumanoidRaces[0] ?? ''}
                  options={sortedHumanoidRaces.map((r) => ({ value: r.key, label: r.labelPt }))}
                  onChange={(value) => setFavoredEnemyHumanoidRaces([value, draft.favoredEnemyHumanoidRaces[1]])}
                />
                {selectedHumanoidRace0 ? (
                  <>
                    <View style={[styles.field, { borderColor: goldColor }]}>
                      <ThemedText style={styles.descriptionParagraph}>{selectedHumanoidRace0.blurbPt}</ThemedText>
                    </View>
                    <FavoredEnemyLanguageField
                      label={`Idioma (${selectedHumanoidRace0.labelPt})`}
                      possibleLanguageNames={getHumanoidRaceLanguages(draft.favoredEnemyHumanoidRaces[0])}
                      languages={languages ?? []}
                      value={draft.favoredEnemyLanguageIds[0]}
                      onChange={(value) => setFavoredEnemyLanguage(0, value)}
                    />
                  </>
                ) : null}

                <SelectField
                  label="Segunda Raça Humanoide"
                  value={draft.favoredEnemyHumanoidRaces[1] ?? ''}
                  options={sortedHumanoidRaces
                    .filter((r) => r.key !== draft.favoredEnemyHumanoidRaces[0])
                    .map((r) => ({ value: r.key, label: r.labelPt }))}
                  onChange={(value) => setFavoredEnemyHumanoidRaces([draft.favoredEnemyHumanoidRaces[0], value])}
                />
                {selectedHumanoidRace1 ? (
                  <>
                    <View style={[styles.field, { borderColor: goldColor }]}>
                      <ThemedText style={styles.descriptionParagraph}>{selectedHumanoidRace1.blurbPt}</ThemedText>
                    </View>
                    <FavoredEnemyLanguageField
                      label={`Idioma (${selectedHumanoidRace1.labelPt})`}
                      possibleLanguageNames={getHumanoidRaceLanguages(draft.favoredEnemyHumanoidRaces[1])}
                      languages={languages ?? []}
                      value={draft.favoredEnemyLanguageIds[1]}
                      onChange={(value) => setFavoredEnemyLanguage(1, value)}
                    />
                  </>
                ) : null}
              </>
            ) : null}

            {selectedFavoredEnemy ? (
              <ThemedText style={styles.hint}>
                Nem toda criatura fala um idioma — isso depende da Inteligência dela. Quando o inimigo só tem um idioma
                associado (ou nenhum), o campo já vem travado nele; quando há mais de uma opção plausível (como o
                Corruptor, que pode falar Abissal ou Infernal), você escolhe entre elas.
              </ThemedText>
            ) : null}
          </>
        ) : null}

        {needsFavoredTerrain ? (
          <>
            <SelectField
              label="Terreno Favorito"
              value={draft.favoredTerrainType ?? ''}
              options={sortedFavoredTerrains.map((o) => ({ value: o.key, label: o.labelPt }))}
              onChange={(value) => setFavoredTerrain(value)}
            />
            {selectedFavoredTerrain ? (
              <View style={[styles.field, { borderColor: goldColor }]}>
                <ThemedText style={styles.descriptionParagraph}>{selectedFavoredTerrain.blurbPt}</ThemedText>
              </View>
            ) : null}
          </>
        ) : null}

        {needsFightingStyle && fightingStyles ? (
          <>
            <SelectField
              label="Estilo de Luta"
              value={draft.fightingStyleId !== null ? String(draft.fightingStyleId) : ''}
              options={fightingStyles.map((f) => ({ value: String(f.id), label: f.name }))}
              onChange={(value) => setFightingStyle(Number(value))}
            />
            {selectedFightingStyle ? (
              <View style={[styles.field, { borderColor: goldColor }]}>
                {selectedFightingStyle.entries.map((entry, index) => (
                  <ThemedText key={index} style={styles.descriptionParagraph}>
                    {entry}
                  </ThemedText>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { borderColor: goldColor }]}>
        <Pressable
          disabled={!canProceed}
          onPress={() => router.push('/wizard/abilities')}
          style={[styles.nextButton, { borderColor: goldColor, opacity: canProceed ? 1 : 0.4 }]}
        >
          <ThemedText style={[styles.nextButtonText, { color: goldColor }]}>Próximo</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

function formatPrimaryAbilities(classInfo: ClassInfo): string {
  const primary = formatAbilitySlot(classInfo.primaryAbility);
  const secondary = formatAbilitySlot(classInfo.secondaryAbility);
  return `Atributos principais: ${primary}, depois ${secondary}.`;
}

function resolveLanguageMatches(englishNames: string[], languages: Language[]): Language[] {
  return englishNames
    .map((name) => languages.find((l) => l.englishName.toLowerCase() === name.toLowerCase()))
    .filter((l): l is Language => l != null);
}

// Renders a favored-enemy language slot: locked (a plain text row, not
// player-editable) when the type/race has zero or one possible language -
// there's nothing truthful to switch it to - or an actual SelectField
// restricted to just that type/race's own possible languages when there's a
// genuine choice (2+, only 'fiend' today). Never offers the full language
// catalog, since the language granted has to be one the favored enemy
// itself could plausibly speak.
function FavoredEnemyLanguageField({
  label,
  possibleLanguageNames,
  languages,
  value,
  onChange,
}: {
  label: string;
  possibleLanguageNames: string[];
  languages: Language[];
  value: number | typeof FAVORED_ENEMY_NO_LANGUAGE | null;
  onChange: (value: number | typeof FAVORED_ENEMY_NO_LANGUAGE) => void;
}) {
  const goldColor = useThemeColor({}, 'gold');
  const matches = resolveLanguageMatches(possibleLanguageNames, languages);

  if (matches.length === 0) {
    return (
      <View style={[styles.field, { borderColor: goldColor }]}>
        <ThemedText style={styles.descriptionParagraph}>{label}: Nenhum (não fala idioma algum).</ThemedText>
      </View>
    );
  }
  if (matches.length === 1) {
    return (
      <View style={[styles.field, { borderColor: goldColor }]}>
        <ThemedText style={styles.descriptionParagraph}>
          {label}: {matches[0].name}.
        </ThemedText>
      </View>
    );
  }
  const sortedMatches = [...matches].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return (
    <SelectField
      label={label}
      value={value !== null && value !== FAVORED_ENEMY_NO_LANGUAGE ? String(value) : ''}
      options={sortedMatches.map((l) => ({ value: String(l.id), label: l.name }))}
      onChange={(v) => onChange(Number(v))}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  nextButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  field: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  descriptionParagraph: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
  },
  hint: {
    fontSize: 13,
    opacity: 0.7,
  },
});
