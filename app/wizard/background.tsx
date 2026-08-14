import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { SelectField } from '@/components/character/select-field';
import { SkillChoiceList } from '@/components/wizard/skill-choice-list';
import { ToolChoiceList } from '@/components/wizard/tool-choice-list';
import { WizardStepHeader } from '@/components/wizard/wizard-step-header';
import { ThemedText } from '@/components/themed-text';
import { SKILLS } from '@/constants/character';
import { useWizardDraft } from '@/context/wizard-context';
import { classGrantsExpertiseAtLevel1, getClassById } from '@/data/queries/classes';
import { getAllBackgrounds } from '@/data/queries/backgrounds';
import { getRaceById } from '@/data/queries/races';
import type { ToolItem } from '@/data/queries/tools';
import type { ResolvedEquipmentEntry } from '@/data/wizard/equipment-resolver';
import { parseBackgroundSkillProficiencies, parseClassSkillChoice, type SkillChoiceClause } from '@/data/wizard/skill-proficiency-resolver';
import { resolveToolProficiencies } from '@/data/wizard/tool-proficiency-resolver';
import { useThemeColor } from '@/hooks/use-theme-color';
import { sortByLocalizedName } from '@/utils/sort-by-name';
import type { SkillKey } from '@/types/character';
import type { Background, CharacterClassDefinition, Race } from '@/types/reference';

const LABEL_BY_SKILL_KEY = Object.fromEntries(SKILLS.map((skill) => [skill.key, skill.label])) as Record<SkillKey, string>;

// The only PHB class whose level-1 "Expertise" text specifies a count -
// always "choose two of your skill proficiencies" (Rogue). No other class
// matches this pattern at level 1 (Bard's Expertise starts at level 3, out
// of scope for a level-1 wizard), so this is safe to fix rather than parse
// out of prose.
const EXPERTISE_CHOICE_COUNT = 2;

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
    setExpertiseSkillChoices,
    setToolProficiencies,
  } = useWizardDraft();
  const goldColor = useThemeColor({}, 'gold');

  const [backgrounds, setBackgrounds] = useState<Background[] | null>(null);
  const [classDef, setClassDef] = useState<CharacterClassDefinition | null>(null);
  const [race, setRace] = useState<Race | null>(null);
  const [subrace, setSubrace] = useState<Race | null>(null);
  const [expertiseAllowed, setExpertiseAllowed] = useState(false);
  const [toolEntries, setToolEntries] = useState<ResolvedEquipmentEntry[] | null>(null);

  const [classSkillSelected, setClassSkillSelected] = useState<SkillKey[]>(draft.classSkillChoices);
  const [raceSkillSelected, setRaceSkillSelected] = useState<SkillKey[]>(draft.raceSkillChoices);
  const [expertiseSelected, setExpertiseSelected] = useState<SkillKey[]>(draft.expertiseSkillChoices);
  const [toolCategoryChoices, setToolCategoryChoices] = useState<Record<string, ToolItem>>({});

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
  // Half-Orc's Intimidação. No PHB subrace carries its own
  // skillProficiencies, but both are checked in case that changes with a
  // future sourcebook.
  const raceSkills = useMemo(() => {
    const fromRace = race ? parseBackgroundSkillProficiencies(race.skillProficiencies) : [];
    const fromSubrace = subrace ? parseBackgroundSkillProficiencies(subrace.skillProficiencies) : [];
    return [...new Set([...fromRace, ...fromSubrace])];
  }, [race, subrace]);

  // Race's own `choose` clause, e.g. Half-Elf's Versatilidade em Perícias
  // ("choose 2 skills of your choice"). Only Half-Elf has one in the PHB.
  const raceSkillClause: SkillChoiceClause | null = useMemo(() => {
    if (!race) return null;
    return parseClassSkillChoice(race.skillProficiencies) ?? (subrace ? parseClassSkillChoice(subrace.skillProficiencies) : null);
  }, [race, subrace]);

  const classSkillClause: SkillChoiceClause | null = useMemo(() => {
    if (!classDef) return null;
    // startingProficiencies is the whole raw DSL object ({weapons, armor,
    // tools, skills, ...}), not just the skills array - unlike
    // background/race skillProficiencies, which are stored as the array
    // itself with no wrapper.
    const skillsField = (classDef.startingProficiencies as { skills?: unknown } | null)?.skills;
    const raw = parseClassSkillChoice(skillsField);
    if (!raw) return null;
    // Don't let the player pick (again) a skill the background/race already
    // grants for free - the simplification documented in docs/TODO.md
    // (RAW would let them swap it for a feat/language instead).
    return { from: raw.from.filter((key) => !backgroundSkills.includes(key) && !raceSkills.includes(key)), count: raw.count };
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

  // Excludes skills already granted/chosen elsewhere so the player doesn't
  // spend Half-Elf's free choice on a skill they'd already have anyway.
  const raceSkillChoicePool = useMemo(() => {
    if (!raceSkillClause) return [];
    return raceSkillClause.from.filter(
      (key) => !backgroundSkills.includes(key) && !raceSkills.includes(key) && !classSkillSelected.includes(key)
    );
  }, [raceSkillClause, backgroundSkills, raceSkills, classSkillSelected]);

  const proficientSkillPool = useMemo(
    () => [...new Set([...backgroundSkills, ...raceSkills, ...classSkillSelected, ...raceSkillSelected])],
    [backgroundSkills, raceSkills, classSkillSelected, raceSkillSelected]
  );

  const allCategoryChoicesResolved = (toolEntries ?? []).every(
    (entry, index) => entry.kind !== 'categoryChoice' || toolCategoryChoices[String(index)] != null
  );

  const canProceed =
    draft.backgroundId !== null &&
    (classSkillClause === null || classSkillSelected.length === classSkillClause.count) &&
    (raceSkillClause === null || raceSkillSelected.length === raceSkillClause.count) &&
    (!expertiseAllowed || expertiseSelected.length === EXPERTISE_CHOICE_COUNT) &&
    toolEntries !== null &&
    allCategoryChoicesResolved;

  function handleNext() {
    if (!canProceed || !toolEntries) return;

    const finalToolEntries: ResolvedEquipmentEntry[] = toolEntries.map((entry, index) => {
      if (entry.kind !== 'categoryChoice') return entry;
      const chosen = toolCategoryChoices[String(index)];
      if (!chosen) return entry;
      return { kind: 'item', itemId: chosen.id, source: chosen.source, name: chosen.name, quantity: 1 };
    });

    setClassSkillChoices(classSkillSelected);
    setRaceSkillChoices(raceSkillSelected);
    setExpertiseSkillChoices(expertiseSelected);
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
            setRaceSkillSelected([]);
            setExpertiseSelected([]);
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

        {classSkillClause ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Perícias de classe
            </ThemedText>
            <SkillChoiceList clause={classSkillClause} selected={classSkillSelected} onChange={setClassSkillSelected} />
          </View>
        ) : null}

        {raceSkillClause ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Perícias raciais (escolha)
            </ThemedText>
            <SkillChoiceList
              clause={{ from: raceSkillChoicePool, count: raceSkillClause.count }}
              selected={raceSkillSelected}
              onChange={setRaceSkillSelected}
            />
          </View>
        ) : null}

        {expertiseAllowed ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Especialização
            </ThemedText>
            <SkillChoiceList
              clause={{ from: proficientSkillPool, count: EXPERTISE_CHOICE_COUNT }}
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
