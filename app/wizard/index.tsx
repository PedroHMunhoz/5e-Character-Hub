import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { AbilityBonusChoice } from '@/components/wizard/ability-bonus-choice';
import { SkillChoiceList } from '@/components/wizard/skill-choice-list';
import { WizardStepHeader } from '@/components/wizard/wizard-step-header';
import { SelectField } from '@/components/character/select-field';
import { ThemedText } from '@/components/themed-text';
import { DRACONIC_ANCESTRIES } from '@/constants/draconic-ancestry';
import { RACE_INFO } from '@/constants/race-info';
import { getSubraceDisplayName } from '@/constants/subrace-names';
import { SUBRACE_INFO } from '@/constants/subrace-info';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useWizardDraft } from '@/context/wizard-context';
import { getAllRaces } from '@/data/queries/races';
import { combineAbilityBonuses } from '@/data/wizard/race-ability-bonus';
import { parseClassSkillChoice } from '@/data/wizard/skill-proficiency-resolver';
import { sortByLocalizedName } from '@/utils/sort-by-name';
import type { AbilityKey, SkillKey } from '@/types/character';
import type { Race } from '@/types/reference';

export default function WizardRaceStep() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { draft, setRace, setSubrace, setAbilityBonusChoices, setDraconicAncestry, setRaceSkillChoices } =
    useWizardDraft();
  const goldColor = useThemeColor({}, 'gold');
  const [races, setRaces] = useState<Race[] | null>(null);
  const [raceSkillSelected, setRaceSkillSelected] = useState<SkillKey[]>(draft.raceSkillChoices);

  useEffect(() => {
    let cancelled = false;
    getAllRaces(db).then((data) => {
      if (!cancelled) setRaces(data);
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  const baseRaces = useMemo(
    () => sortByLocalizedName((races ?? []).filter((race) => race.parentRaceId === null)),
    [races]
  );
  const selectedRace = useMemo(() => baseRaces.find((race) => race.id === draft.raceId) ?? null, [baseRaces, draft.raceId]);

  // Variant Human isn't presented as a two-step "pick Human, then pick a
  // subrace" choice like Dwarf/Elf/Gnome/Halfling - RAW frames it as an
  // alternative build of Human, not one of several subrace flavors, so it's
  // surfaced directly in the top-level "Raça" combo as its own entry
  // ("Humano Variante"). It's still the same underlying subrace row (parent_
  // race_id = Human) under the hood - picking it just dispatches setRace +
  // setSubrace together instead of two separate steps.
  const variantRace = useMemo(() => (races ?? []).find((race) => race.englishName === 'Variant') ?? null, [races]);
  const raceOptions = useMemo(() => {
    const options = baseRaces.map((race) => ({
      value: String(race.id),
      label: race.name,
      raceId: race.id,
      subraceId: null as number | null,
    }));
    if (variantRace) {
      options.push({
        value: String(variantRace.id),
        label: getSubraceDisplayName(variantRace.englishName, variantRace.name),
        raceId: variantRace.parentRaceId!,
        subraceId: variantRace.id,
      });
    }
    return options.sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
  }, [baseRaces, variantRace]);

  // subraces (the "Sub-raça" combo) excludes Variant - it's picked from the
  // "Raça" combo above instead. For Human this leaves the list empty (no
  // other PHB subrace), so the "Sub-raça" step simply never renders for it.
  const subraces = useMemo(() => {
    // Every base race also has parentRaceId === null - without this guard,
    // "no race picked yet" (draft.raceId === null) matched that same
    // condition and populated the subrace combo with the full race list
    // before the player had chosen anything.
    if (draft.raceId === null) return [];
    return sortByLocalizedName(
      (races ?? []).filter((race) => race.parentRaceId === draft.raceId && race.englishName !== 'Variant')
    );
  }, [races, draft.raceId]);
  // Resolved from the full race list (not the filtered `subraces` combo
  // above) so Variant still resolves correctly even though it no longer
  // appears in that combo.
  const selectedSubrace = useMemo(
    () => (races ?? []).find((race) => race.id === draft.subraceId) ?? null,
    [races, draft.subraceId]
  );

  const isDragonborn = selectedRace?.englishName === 'Dragonborn';
  // Variant Human REPLACES the standard Human's own fixed "+1 to all six"
  // bonus with its own +1/+1-to-two-abilities `choose` clause - it doesn't
  // ADD to it. combineAbilityBonuses normally sums race+subrace, so the
  // base Human bonus must be suppressed here (passed as null) whenever this
  // subrace is picked, or a Variant Human would incorrectly get both.
  const isVariantHuman = selectedSubrace?.englishName === 'Variant';
  const raceInfo = selectedRace ? (RACE_INFO[selectedRace.englishName] ?? null) : null;
  const subraceInfo = selectedSubrace ? (SUBRACE_INFO[selectedSubrace.englishName] ?? null) : null;

  const combinedBonuses = useMemo(
    () =>
      combineAbilityBonuses(
        isVariantHuman ? null : (selectedRace?.abilityBonuses ?? null),
        selectedSubrace?.abilityBonuses ?? null
      ),
    [selectedRace, selectedSubrace, isVariantHuman]
  );
  // The PHB never combines more than one `choose` clause for a single
  // race+subrace pair (only Half-Elf has one at all) - see combineAbilityBonuses.
  const bonusChoiceClause = combinedBonuses.choices[0];

  // Race's own skill-choice clause - Half-Elf's Versatilidade em Perícias
  // ({"any":2} on the race row) and Variant Human's "one skill proficiency
  // of your choice" ({"any":1}, stored on the "Variant" subrace row, not the
  // base Human row - see races.skill_proficiencies in db/schema.sql) are the
  // only two in the PHB. No race+subrace pair ever has a clause on both at
  // once, so checking the race first and falling back to the subrace is
  // enough - no need to combine them. Resolved here, before class/background
  // exist, so there's nothing to exclude yet - the Antecedente step (Passo
  // 4) later reads draft.raceSkillChoices back as an already-fixed grant,
  // the same way it reads Elf/Half-Orc's fixed skill.
  const raceSkillClause = useMemo(() => {
    if (!selectedRace) return null;
    return (
      parseClassSkillChoice(selectedRace.skillProficiencies) ??
      (selectedSubrace ? parseClassSkillChoice(selectedSubrace.skillProficiencies) : null)
    );
  }, [selectedRace, selectedSubrace]);

  const needsSubrace = subraces.length > 0 && draft.subraceId === null;
  const needsBonusChoice = bonusChoiceClause
    ? Object.values(draft.abilityBonusChoices).filter((v) => v && v > 0).length < bonusChoiceClause.count
    : false;
  const needsSkillChoice = raceSkillClause ? raceSkillSelected.length < raceSkillClause.count : false;
  const needsDraconicAncestry = isDragonborn && draft.draconicAncestry === null;
  const canProceed =
    draft.raceId !== null && !needsSubrace && !needsBonusChoice && !needsSkillChoice && !needsDraconicAncestry;

  function handleNext() {
    if (!canProceed) return;
    setRaceSkillChoices(raceSkillSelected);
    router.push('/wizard/class');
  }

  if (races === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={goldColor} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <WizardStepHeader step={1} title="Raça" subtitle="Escolha a raça do seu personagem." />

        <SelectField
          label="Raça"
          value={isVariantHuman ? String(draft.subraceId) : draft.raceId !== null ? String(draft.raceId) : ''}
          options={raceOptions.map((option) => ({ value: option.value, label: option.label }))}
          onChange={(value) => {
            const option = raceOptions.find((o) => o.value === value);
            if (!option) return;
            setRace(option.raceId);
            if (option.subraceId !== null) setSubrace(option.subraceId);
            // raceSkillChoices already resets in the draft (SET_RACE/
            // SET_SUBRACE reducer cases), but this is local component state
            // (only committed to the draft on "Próximo") and doesn't pick
            // that up on its own - without this it stays "selected"
            // internally even once its skills disappear from the
            // recomputed pool.
            setRaceSkillSelected([]);
          }}
        />

        {raceInfo ? (
          <View style={[styles.field, { borderColor: goldColor }]}>
            <ThemedText style={styles.descriptionParagraph}>{raceInfo['pt-BR']}</ThemedText>
          </View>
        ) : null}

        {subraces.length > 0 ? (
          <SelectField
            label="Sub-raça"
            value={draft.subraceId !== null ? String(draft.subraceId) : ''}
            options={subraces.map((race) => ({
              value: String(race.id),
              label: getSubraceDisplayName(race.englishName, race.name),
            }))}
            onChange={(value) => {
              setSubrace(Number(value));
              setRaceSkillSelected([]);
            }}
          />
        ) : null}

        {subraceInfo ? (
          <View style={[styles.field, { borderColor: goldColor }]}>
            <ThemedText style={styles.descriptionParagraph}>{subraceInfo['pt-BR']}</ThemedText>
          </View>
        ) : null}

        {isDragonborn ? (
          <SelectField
            label="Linhagem Dracônica"
            value={draft.draconicAncestry ?? ''}
            options={[...DRACONIC_ANCESTRIES]
              .sort((a, b) => a.labelPt.localeCompare(b.labelPt, 'pt-BR'))
              .map((ancestry) => ({ value: ancestry.key, label: ancestry.labelPt }))}
            onChange={(value) => setDraconicAncestry(value)}
          />
        ) : null}

        {bonusChoiceClause ? (
          <AbilityBonusChoice
            clause={bonusChoiceClause}
            selected={Object.entries(draft.abilityBonusChoices)
              .filter(([, amount]) => (amount ?? 0) > 0)
              .map(([key]) => key as AbilityKey)}
            onChange={(selected) => {
              const choices: Partial<Record<AbilityKey, number>> = {};
              for (const key of selected) choices[key] = 1;
              setAbilityBonusChoices(choices);
            }}
          />
        ) : null}

        {raceSkillClause ? (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Perícias raciais (escolha)
            </ThemedText>
            <SkillChoiceList clause={raceSkillClause} selected={raceSkillSelected} onChange={setRaceSkillSelected} />
          </View>
        ) : null}

        {selectedRace ? (
          <ThemedText style={styles.bonusSummary}>{formatBonusSummary(combinedBonuses.fixed)}</ThemedText>
        ) : null}
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

function formatBonusSummary(fixed: Partial<Record<AbilityKey, number>>): string {
  const labels: Record<AbilityKey, string> = { str: 'For', dex: 'Des', con: 'Con', int: 'Int', wis: 'Sab', cha: 'Car' };
  const parts = (Object.entries(fixed) as [AbilityKey, number][])
    .filter(([, amount]) => amount !== 0)
    .map(([key, amount]) => `${labels[key]} +${amount}`);
  return parts.length > 0 ? `Bônus racial fixo: ${parts.join(', ')}` : 'Sem bônus racial fixo.';
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
  bonusSummary: {
    fontSize: 13,
    opacity: 0.7,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
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
