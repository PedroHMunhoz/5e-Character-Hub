import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { CheckboxToggle } from '@/components/character/checkbox-toggle';
import { SelectField } from '@/components/character/select-field';
import {
  LanguageChoiceList,
  type DisabledLanguage,
  type LanguageChoiceClause,
} from '@/components/wizard/language-choice-list';
import { SkillChoiceList } from '@/components/wizard/skill-choice-list';
import { ToolChoiceList } from '@/components/wizard/tool-choice-list';
import { WizardStepHeader } from '@/components/wizard/wizard-step-header';
import { ThemedText } from '@/components/themed-text';
import { SKILLS } from '@/constants/character';
import { useWizardDraft } from '@/context/wizard-context';
import { classGrantsExpertiseAtLevel1, getClassById } from '@/data/queries/classes';
import { getAllBackgrounds } from '@/data/queries/backgrounds';
import { itemKey } from '@/data/queries/equipment-lookup';
import { getAllLanguages, type Language } from '@/data/queries/languages';
import { getRaceById } from '@/data/queries/races';
import { getToolItemByEnglishName, type ToolItem } from '@/data/queries/tools';
import type { ResolvedEquipmentEntry } from '@/data/wizard/equipment-resolver';
import { parseFixedLanguageEnglishNames, parseLanguageChoiceCount } from '@/data/wizard/language-proficiency-resolver';
import {
  ALL_SKILL_KEYS,
  parseBackgroundSkillProficiencies,
  parseClassSkillChoice,
  resolveSkillChoicePool,
  type SkillChoiceClause,
} from '@/data/wizard/skill-proficiency-resolver';
import { resolveToolProficiencies } from '@/data/wizard/tool-proficiency-resolver';
import { useThemeColor } from '@/hooks/use-theme-color';
import { sortByLocalizedName } from '@/utils/sort-by-name';
import type { SkillKey } from '@/types/character';
import type { Background, CharacterClassDefinition, Race } from '@/types/reference';

const LABEL_BY_SKILL_KEY = Object.fromEntries(SKILLS.map((skill) => [skill.key, skill.label])) as Record<
  SkillKey,
  string
>;

// The only PHB class whose level-1 "Expertise" text specifies a count -
// always "choose two of your skill proficiencies, or one of your skill
// proficiencies and your proficiency with thieves' tools" (Rogue). No other
// class matches this pattern at level 1 (Bard's Expertise starts at level 3,
// out of scope for a level-1 wizard). The thieves'-tools swap (below) drops
// the required skill count from this total to `EXPERTISE_CHOICE_COUNT - 1`.
const EXPERTISE_CHOICE_COUNT = 2;

// Only exact-match tool proficiency the level-1 Expertise text allows
// swapping a skill pick for - never "any tool" in general.
const EXPERTISE_TOOL_ENGLISH_NAME = "thieves' tools";

// Class and background tool grants are resolved independently and then
// concatenated - if both happen to grant the same tool (e.g. a Rogue with
// the Criminal background, both granting thieves' tools), the resolved list
// would otherwise show it twice. Harmless once persisted (CharacterSheet.
// tools is keyed by item id, so a duplicate write is a no-op), but still
// worth collapsing here so the wizard doesn't display the same tool twice.
function dedupeResolvedItemEntries(entries: ResolvedEquipmentEntry[]): ResolvedEquipmentEntry[] {
  const seenItemIds = new Set<number>();
  return entries.filter((entry) => {
    if (entry.kind !== 'item') return true;
    if (seenItemIds.has(entry.itemId)) return false;
    seenItemIds.add(entry.itemId);
    return true;
  });
}

export default function WizardBackgroundStep() {
  const db = useSQLiteContext();
  const router = useRouter();
  const {
    draft,
    setBackground,
    setClassSkillChoices,
    setRaceSkillChoices,
    setRaceLanguageChoices,
    setBackgroundLanguageChoices,
    setExpertiseSkillChoices,
    setExpertiseToolChoice,
    setToolProficiencies,
  } = useWizardDraft();
  const goldColor = useThemeColor({}, 'gold');

  const [backgrounds, setBackgrounds] = useState<Background[] | null>(null);
  const [classDef, setClassDef] = useState<CharacterClassDefinition | null>(null);
  const [race, setRace] = useState<Race | null>(null);
  const [subrace, setSubrace] = useState<Race | null>(null);
  const [expertiseAllowed, setExpertiseAllowed] = useState(false);
  const [toolEntries, setToolEntries] = useState<ResolvedEquipmentEntry[] | null>(null);
  const [expertiseToolItem, setExpertiseToolItem] = useState<ToolItem | null>(null);
  const [allLanguages, setAllLanguages] = useState<Language[] | null>(null);

  const [classSkillSelected, setClassSkillSelected] = useState<SkillKey[]>(draft.classSkillChoices);
  // Replacement pick(s) for a Raça-step skill choice that collides with the
  // background's fixed grant - see raceSkillChoiceCollisions below. Not
  // initialized from the draft (unlike the other selections here) since
  // there's nothing to resume: the collision, if any, is only known once a
  // background is picked on this same screen.
  const [raceSkillCollisionReplacement, setRaceSkillCollisionReplacement] = useState<SkillKey[]>([]);
  const [raceLanguageSelected, setRaceLanguageSelected] = useState<number[]>(draft.raceLanguageChoices);
  const [backgroundLanguageSelected, setBackgroundLanguageSelected] = useState<number[]>(
    draft.backgroundLanguageChoices
  );
  const [expertiseSelected, setExpertiseSelected] = useState<SkillKey[]>(draft.expertiseSkillChoices);
  const [expertiseUsesTool, setExpertiseUsesTool] = useState<boolean>(draft.expertiseToolChoice !== null);
  const [toolCategoryChoices, setToolCategoryChoices] = useState<Record<string, ToolItem>>({});

  useEffect(() => {
    let cancelled = false;
    getToolItemByEnglishName(db, EXPERTISE_TOOL_ENGLISH_NAME).then((item) => {
      if (!cancelled) setExpertiseToolItem(item);
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  useEffect(() => {
    let cancelled = false;
    getAllBackgrounds(db).then((data) => {
      if (!cancelled) setBackgrounds(sortByLocalizedName(data));
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  useEffect(() => {
    let cancelled = false;
    getAllLanguages(db).then((data) => {
      if (!cancelled) setAllLanguages(data);
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  useEffect(() => {
    if (draft.classId === null) return;
    let cancelled = false;
    getClassById(db, draft.classId).then((data) => {
      if (!cancelled) setClassDef(data);
    });
    classGrantsExpertiseAtLevel1(db, draft.classId).then((grants) => {
      if (!cancelled) setExpertiseAllowed(grants);
    });
    return () => {
      cancelled = true;
    };
  }, [db, draft.classId]);

  useEffect(() => {
    if (draft.raceId === null) return;
    let cancelled = false;
    getRaceById(db, draft.raceId).then((data) => {
      if (!cancelled) setRace(data);
    });
    return () => {
      cancelled = true;
    };
  }, [db, draft.raceId]);

  useEffect(() => {
    if (draft.subraceId === null) {
      setSubrace(null);
      return;
    }
    let cancelled = false;
    getRaceById(db, draft.subraceId).then((data) => {
      if (!cancelled) setSubrace(data);
    });
    return () => {
      cancelled = true;
    };
  }, [db, draft.subraceId]);

  const selectedBackground = useMemo(
    () => (backgrounds ?? []).find((background) => background.id === draft.backgroundId) ?? null,
    [backgrounds, draft.backgroundId]
  );

  const backgroundSkills = useMemo(
    () => (selectedBackground ? parseBackgroundSkillProficiencies(selectedBackground.skillProficiencies) : []),
    [selectedBackground]
  );

  // Fixed (non-`choose`) race-granted skills, e.g. Elf's Percepção or
  // Half-Orc's Intimidação. No PHB subrace carries its own fixed
  // skillProficiencies, but it's checked in case that changes with a future
  // sourcebook.
  const raceSkillsFixed = useMemo(() => {
    const fromRace = race ? parseBackgroundSkillProficiencies(race.skillProficiencies) : [];
    const fromSubrace = subrace ? parseBackgroundSkillProficiencies(subrace.skillProficiencies) : [];
    return [...new Set([...fromRace, ...fromSubrace])];
  }, [race, subrace]);

  // A skill the player picked in the Raça step (Half-Elf/Variant Human's
  // `choose` clause) can turn out to collide with the background's fixed
  // grant - background is picked afterward, on this screen, so there was no
  // way to exclude it at pick time. PHB p.127 says the player swaps the
  // collided pick for a different skill instead of losing it - see the
  // replacement pool below.
  const raceSkillChoiceCollisions = useMemo(
    () => draft.raceSkillChoices.filter((key) => backgroundSkills.includes(key)),
    [draft.raceSkillChoices, backgroundSkills]
  );

  const raceSkillCollisionClause: SkillChoiceClause | null = useMemo(() => {
    if (raceSkillChoiceCollisions.length === 0) return null;
    return resolveSkillChoicePool(
      { from: ALL_SKILL_KEYS, count: raceSkillChoiceCollisions.length },
      [...backgroundSkills, ...raceSkillsFixed, ...draft.raceSkillChoices]
    );
  }, [raceSkillChoiceCollisions, backgroundSkills, raceSkillsFixed, draft.raceSkillChoices]);

  // Effective race-granted skills used everywhere else on this screen
  // (display + excluding from the class's own pool below): fixed grants,
  // whatever the player picked in the Raça step that DIDN'T collide with
  // this background, and whatever they picked here as a replacement for
  // what did.
  const raceSkills = useMemo(() => {
    const nonCollidingChoices = draft.raceSkillChoices.filter((key) => !backgroundSkills.includes(key));
    return [...new Set([...raceSkillsFixed, ...nonCollidingChoices, ...raceSkillCollisionReplacement])];
  }, [raceSkillsFixed, draft.raceSkillChoices, backgroundSkills, raceSkillCollisionReplacement]);

  const classSkillClause: SkillChoiceClause | null = useMemo(() => {
    if (!classDef) return null;
    // startingProficiencies is the whole raw DSL object ({weapons, armor,
    // tools, skills, ...}), not just the skills array - unlike
    // background/race skillProficiencies, which are stored as the array
    // itself with no wrapper.
    const skillsField = (classDef.startingProficiencies as { skills?: unknown } | null)?.skills;
    const raw = parseClassSkillChoice(skillsField);
    if (!raw) return null;
    // Don't let the player pick (again) a skill already granted by
    // background or race (fixed traits + the race's own skill choice,
    // already folded into raceSkills above) - PHB p.127 lets them swap a
    // collided pick for a different skill instead, which
    // resolveSkillChoicePool also backs into when the class's own list runs
    // dry from too much overlap (see docs/TODO.md).
    return resolveSkillChoicePool(raw, [...backgroundSkills, ...raceSkills]);
  }, [classDef, backgroundSkills, raceSkills]);

  // Resolve tool proficiencies (class + background combined) once both are
  // known - re-runs whenever either changes.
  useEffect(() => {
    if (!classDef || !selectedBackground) {
      setToolEntries(null);
      return;
    }
    let cancelled = false;
    const classToolProfs = (classDef.startingProficiencies as { toolProficiencies?: unknown })?.toolProficiencies;
    const backgroundToolProfs = selectedBackground.toolProficiencies;
    const combined = [...((classToolProfs as unknown[]) ?? []), ...((backgroundToolProfs as unknown[]) ?? [])];
    resolveToolProficiencies(db, combined).then((entries) => {
      if (!cancelled) {
        setToolEntries(dedupeResolvedItemEntries(entries));
        setToolCategoryChoices({});
      }
    });
    return () => {
      cancelled = true;
    };
  }, [db, classDef, selectedBackground]);

  const proficientSkillPool = useMemo(
    () => [...new Set([...backgroundSkills, ...raceSkills, ...classSkillSelected])],
    [backgroundSkills, raceSkills, classSkillSelected]
  );

  const languageByEnglishName = useMemo(
    () => new Map((allLanguages ?? []).map((language) => [language.englishName.toLowerCase(), language])),
    [allLanguages]
  );
  // Excludes Common - every PHB race grants it as a fixed language (see
  // raceLanguagesFixed below), so it'd be a redundant, always-disabled entry
  // in every anyStandard choice list.
  const standardLanguages = useMemo(
    () =>
      (allLanguages ?? []).filter(
        (language) => language.type === 'standard' && language.englishName.toLowerCase() !== 'common'
      ),
    [allLanguages]
  );

  // A subrace's own `languages` value (only High Elf in the PHB) overwrites
  // the base race's grant entirely rather than adding to it - same
  // "overwrite" flag the raw 5etools data uses, confirmed live against
  // every PHB race/subrace (see docs/TODO.md).
  const effectiveRaceLanguagesRaw = subrace?.languages ?? race?.languages ?? null;
  const raceLanguagesFixedNames = useMemo(
    () => parseFixedLanguageEnglishNames(effectiveRaceLanguagesRaw),
    [effectiveRaceLanguagesRaw]
  );
  const raceLanguageChoiceCount = useMemo(
    () => parseLanguageChoiceCount(effectiveRaceLanguagesRaw),
    [effectiveRaceLanguagesRaw]
  );
  const raceLanguagesFixed = useMemo(
    () =>
      raceLanguagesFixedNames.map((name) => languageByEnglishName.get(name)).filter((l): l is Language => l != null),
    [raceLanguagesFixedNames, languageByEnglishName]
  );

  const backgroundLanguagesFixedNames = useMemo(
    () => (selectedBackground ? parseFixedLanguageEnglishNames(selectedBackground.languageProficiencies) : []),
    [selectedBackground]
  );
  const backgroundLanguageChoiceCount = useMemo(
    () => (selectedBackground ? parseLanguageChoiceCount(selectedBackground.languageProficiencies) : null),
    [selectedBackground]
  );
  const backgroundLanguagesFixed = useMemo(
    () =>
      backgroundLanguagesFixedNames
        .map((name) => languageByEnglishName.get(name))
        .filter((l): l is Language => l != null),
    [backgroundLanguagesFixedNames, languageByEnglishName]
  );

  // Languages already granted by the *other* section on this screen - shown
  // disabled (not hidden) in each list, so picking one in the race section
  // doesn't make it silently vanish from the background section (or vice
  // versa) with no explanation. A language's own source still just omits it
  // from both `from` and `disabled` - it's already visible in that source's
  // own fixed-grant bullet list just above.
  const raceLanguageCrossDisabled = useMemo(
    () =>
      standardLanguages.filter(
        (l) => backgroundLanguagesFixed.some((f) => f.id === l.id) || backgroundLanguageSelected.includes(l.id)
      ),
    [standardLanguages, backgroundLanguagesFixed, backgroundLanguageSelected]
  );
  const backgroundLanguageCrossDisabled = useMemo(
    () =>
      standardLanguages.filter(
        (l) => raceLanguagesFixed.some((f) => f.id === l.id) || raceLanguageSelected.includes(l.id)
      ),
    [standardLanguages, raceLanguagesFixed, raceLanguageSelected]
  );

  // Languages already granted by the Ranger's Favored Enemy pick(s) - see
  // constants/favored-enemy.ts/app/wizard/class.tsx. Only ever overlaps this
  // screen's pool when the favored enemy's language happens to be one of the
  // 7 "standard" ones shown here (e.g. Giant, Goblin, Orc) - most favored
  // enemy languages are exotic (Draconic, Abyssal, ...) and never appear in
  // this list at all.
  const favoredEnemyLanguageIds = useMemo(
    () => draft.favoredEnemyLanguageIds.filter((id): id is number => typeof id === 'number'),
    [draft.favoredEnemyLanguageIds]
  );
  const favoredEnemyDisabledLanguages = useMemo(
    () => standardLanguages.filter((l) => favoredEnemyLanguageIds.includes(l.id)),
    [standardLanguages, favoredEnemyLanguageIds]
  );

  const raceLanguageClause: LanguageChoiceClause | null = useMemo(() => {
    if (raceLanguageChoiceCount === null) return null;
    const pool = standardLanguages.filter(
      (l) =>
        !raceLanguagesFixed.some((f) => f.id === l.id) &&
        !raceLanguageCrossDisabled.some((d) => d.id === l.id) &&
        !favoredEnemyDisabledLanguages.some((d) => d.id === l.id)
    );
    return { from: pool, count: raceLanguageChoiceCount };
  }, [
    raceLanguageChoiceCount,
    standardLanguages,
    raceLanguagesFixed,
    raceLanguageCrossDisabled,
    favoredEnemyDisabledLanguages,
  ]);

  const backgroundLanguageClause: LanguageChoiceClause | null = useMemo(() => {
    if (backgroundLanguageChoiceCount === null) return null;
    const pool = standardLanguages.filter(
      (l) =>
        !backgroundLanguagesFixed.some((f) => f.id === l.id) &&
        !backgroundLanguageCrossDisabled.some((d) => d.id === l.id) &&
        !favoredEnemyDisabledLanguages.some((d) => d.id === l.id)
    );
    return { from: pool, count: backgroundLanguageChoiceCount };
  }, [
    backgroundLanguageChoiceCount,
    standardLanguages,
    backgroundLanguagesFixed,
    backgroundLanguageCrossDisabled,
    favoredEnemyDisabledLanguages,
  ]);

  const favoredEnemyDisabledEntries: DisabledLanguage[] = useMemo(
    () => favoredEnemyDisabledLanguages.map((language) => ({ language, note: 'Já selecionado pelo Inimigo Favorito' })),
    [favoredEnemyDisabledLanguages]
  );
  const raceLanguageDisabledEntries: DisabledLanguage[] = useMemo(
    () => [...raceLanguageCrossDisabled.map((language) => ({ language })), ...favoredEnemyDisabledEntries],
    [raceLanguageCrossDisabled, favoredEnemyDisabledEntries]
  );
  const backgroundLanguageDisabledEntries: DisabledLanguage[] = useMemo(
    () => [...backgroundLanguageCrossDisabled.map((language) => ({ language })), ...favoredEnemyDisabledEntries],
    [backgroundLanguageCrossDisabled, favoredEnemyDisabledEntries]
  );

  // Whether the character actually has thieves' tools proficiency (from
  // class and/or background) - only then can Expertise swap a skill pick for
  // it. Checked against `toolEntries` (fixed grants, already resolved
  // regardless of any pending categoryChoice) rather than `finalToolEntries`,
  // since thieves' tools is never granted via an "any artisan's tool"-style
  // category choice in the PHB.
  const hasThievesTools = useMemo(() => {
    if (!expertiseToolItem) return false;
    return (toolEntries ?? []).some(
      (entry) =>
        entry.kind === 'item' && entry.itemId === expertiseToolItem.id && entry.source === expertiseToolItem.source
    );
  }, [toolEntries, expertiseToolItem]);

  // Guards against the same staleness issue as classSkillSelected/etc above -
  // if the background changes and thieves' tools proficiency disappears
  // while the swap was checked, un-check it instead of silently blocking
  // "Próximo" on an unreachable state.
  useEffect(() => {
    if (!hasThievesTools) setExpertiseUsesTool(false);
  }, [hasThievesTools]);

  const requiredExpertiseSkillCount = EXPERTISE_CHOICE_COUNT - (expertiseUsesTool ? 1 : 0);

  // 'unresolved' (DSL text the resolver didn't recognize) has no picker to
  // recover through - unlike categoryChoice, it isn't a player choice, it's
  // a data gap - so it blocks proceeding too. 'special' (e.g. vehicle
  // proficiency) does NOT block: those are intentionally persisted as
  // freeform text (CharacterSheet.freeformToolProficiencies), not dropped.
  const allToolEntriesResolved = (toolEntries ?? []).every(
    (entry, index) =>
      entry.kind !== 'unresolved' && (entry.kind !== 'categoryChoice' || toolCategoryChoices[String(index)] != null)
  );

  const canProceed =
    draft.backgroundId !== null &&
    (classSkillClause === null || classSkillSelected.length === classSkillClause.count) &&
    (raceSkillCollisionClause === null || raceSkillCollisionReplacement.length === raceSkillCollisionClause.count) &&
    (raceLanguageClause === null || raceLanguageSelected.length === raceLanguageClause.count) &&
    (backgroundLanguageClause === null || backgroundLanguageSelected.length === backgroundLanguageClause.count) &&
    (!expertiseAllowed || expertiseSelected.length === requiredExpertiseSkillCount) &&
    toolEntries !== null &&
    allToolEntriesResolved;

  function toggleExpertiseTool() {
    const next = !expertiseUsesTool;
    setExpertiseUsesTool(next);
    if (next && expertiseSelected.length > EXPERTISE_CHOICE_COUNT - 1) {
      setExpertiseSelected(expertiseSelected.slice(0, EXPERTISE_CHOICE_COUNT - 1));
    }
  }

  function handleNext() {
    if (!canProceed || !toolEntries) return;

    const finalToolEntries: ResolvedEquipmentEntry[] = toolEntries.map((entry, index) => {
      if (entry.kind !== 'categoryChoice') return entry;
      const chosen = toolCategoryChoices[String(index)];
      if (!chosen) return entry;
      return { kind: 'item', itemId: chosen.id, source: chosen.source, name: chosen.name, quantity: 1 };
    });

    setClassSkillChoices(classSkillSelected);
    if (raceSkillChoiceCollisions.length > 0) {
      setRaceSkillChoices([
        ...draft.raceSkillChoices.filter((key) => !backgroundSkills.includes(key)),
        ...raceSkillCollisionReplacement,
      ]);
    }
    setRaceLanguageChoices(raceLanguageSelected);
    setBackgroundLanguageChoices(backgroundLanguageSelected);
    setExpertiseSkillChoices(expertiseSelected);
    setExpertiseToolChoice(
      expertiseUsesTool && expertiseToolItem ? itemKey(expertiseToolItem.source, expertiseToolItem.id) : null
    );
    setToolProficiencies(finalToolEntries);
    router.push('/wizard/equipment');
  }

  if (backgrounds === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={goldColor} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <WizardStepHeader step={4} title="Antecedente, Perícias e Ferramentas" />

        <SelectField
          label="Antecedente"
          value={draft.backgroundId !== null ? String(draft.backgroundId) : ''}
          options={backgrounds.map((background) => ({ value: String(background.id), label: background.name }))}
          onChange={(value) => {
            setBackground(Number(value));
            // classSkillChoices already resets in the draft (SET_BACKGROUND
            // reducer case), but these three lists are local component
            // state (only committed to the draft on "Próximo") and don't
            // pick that up on their own - without this they stay "selected"
            // internally even once their skills disappear from the
            // recomputed pool, silently blocking new picks.
            setClassSkillSelected([]);
            setRaceSkillCollisionReplacement([]);
            setRaceLanguageSelected([]);
            setBackgroundLanguageSelected([]);
            setExpertiseSelected([]);
            setExpertiseUsesTool(false);
          }}
        />

        {selectedBackground ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Perícias do antecedente
            </ThemedText>
            {backgroundSkills.length > 0 ? (
              backgroundSkills.map((key) => (
                <ThemedText key={key} style={styles.fixedEntry}>
                  • {LABEL_BY_SKILL_KEY[key]}
                </ThemedText>
              ))
            ) : (
              <ThemedText style={styles.fixedEntry}>Nenhuma.</ThemedText>
            )}
          </View>
        ) : null}

        {raceSkills.length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Perícias raciais
            </ThemedText>
            {raceSkills.map((key) => (
              <ThemedText key={key} style={styles.fixedEntry}>
                • {LABEL_BY_SKILL_KEY[key]}
              </ThemedText>
            ))}
          </View>
        ) : null}

        {raceSkillCollisionClause ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Perícias raciais — substituição por colisão
            </ThemedText>
            <ThemedText style={styles.fixedEntry}>
              {raceSkillChoiceCollisions.map((key) => LABEL_BY_SKILL_KEY[key]).join(', ')}{' '}
              {raceSkillChoiceCollisions.length === 1 ? 'já é' : 'já são'} concedida pelo antecedente - escolha
              {raceSkillChoiceCollisions.length === 1 ? ' outra perícia' : ' outras perícias'} no lugar (PHB p.127).
            </ThemedText>
            <SkillChoiceList
              clause={raceSkillCollisionClause}
              selected={raceSkillCollisionReplacement}
              onChange={setRaceSkillCollisionReplacement}
            />
          </View>
        ) : null}

        {classSkillClause ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Perícias de classe
            </ThemedText>
            <SkillChoiceList clause={classSkillClause} selected={classSkillSelected} onChange={setClassSkillSelected} />
          </View>
        ) : null}

        {raceLanguagesFixed.length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Idiomas raciais
            </ThemedText>
            {raceLanguagesFixed.map((language) => (
              <ThemedText key={language.id} style={styles.fixedEntry}>
                • {language.name}
              </ThemedText>
            ))}
          </View>
        ) : null}

        {backgroundLanguagesFixed.length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Idiomas do antecedente
            </ThemedText>
            {backgroundLanguagesFixed.map((language) => (
              <ThemedText key={language.id} style={styles.fixedEntry}>
                • {language.name}
              </ThemedText>
            ))}
          </View>
        ) : null}

        {raceLanguageClause ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Idiomas raciais (escolha)
            </ThemedText>
            <LanguageChoiceList
              clause={raceLanguageClause}
              selected={raceLanguageSelected}
              onChange={setRaceLanguageSelected}
              disabled={raceLanguageDisabledEntries}
            />
          </View>
        ) : null}

        {backgroundLanguageClause ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Idiomas do antecedente (escolha)
            </ThemedText>
            <LanguageChoiceList
              clause={backgroundLanguageClause}
              selected={backgroundLanguageSelected}
              onChange={setBackgroundLanguageSelected}
              disabled={backgroundLanguageDisabledEntries}
            />
          </View>
        ) : null}

        {expertiseAllowed ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Especialização
            </ThemedText>
            {hasThievesTools ? (
              <Pressable style={styles.toolExpertiseRow} onPress={toggleExpertiseTool}>
                <CheckboxToggle checked={expertiseUsesTool} onToggle={toggleExpertiseTool} />
                <ThemedText style={styles.fixedEntry}>Ferramentas de Ladrão (em vez de uma perícia)</ThemedText>
              </Pressable>
            ) : null}
            <SkillChoiceList
              clause={{ from: proficientSkillPool, count: requiredExpertiseSkillCount }}
              selected={expertiseSelected}
              onChange={setExpertiseSelected}
            />
          </View>
        ) : null}

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Ferramentas
          </ThemedText>
          {toolEntries === null ? (
            <ActivityIndicator color={goldColor} />
          ) : (
            <ToolChoiceList
              entries={toolEntries}
              categoryChoices={toolCategoryChoices}
              onChangeCategoryChoice={(entryKey, item) =>
                setToolCategoryChoices((prev) => ({ ...prev, [entryKey]: item }))
              }
            />
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderColor: goldColor }]}>
        <Pressable
          disabled={!canProceed}
          onPress={handleNext}
          style={[styles.nextButton, { borderColor: goldColor, opacity: canProceed ? 1 : 0.4 }]}
        >
          <ThemedText style={[styles.nextButtonText, { color: goldColor }]}>Próximo</ThemedText>
        </Pressable>
      </View>
    </View>
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
    gap: 20,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
  },
  fixedEntry: {
    fontSize: 15,
  },
  toolExpertiseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
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
});
