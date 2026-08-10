import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { AbilityBonusChoice } from '@/components/wizard/ability-bonus-choice';
import { WizardStepHeader } from '@/components/wizard/wizard-step-header';
import { SelectField } from '@/components/character/select-field';
import { ThemedText } from '@/components/themed-text';
import { DRACONIC_ANCESTRIES } from '@/constants/draconic-ancestry';
import { getSubraceDisplayName } from '@/constants/subrace-names';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useWizardDraft } from '@/context/wizard-context';
import { getAllRaces } from '@/data/queries/races';
import { combineAbilityBonuses } from '@/data/wizard/race-ability-bonus';
import { sortByLocalizedName } from '@/utils/sort-by-name';
import type { AbilityKey } from '@/types/character';
import type { Race } from '@/types/reference';

export default function WizardRaceStep() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { draft, setRace, setSubrace, setAbilityBonusChoices, setDraconicAncestry } = useWizardDraft();
  const goldColor = useThemeColor({}, 'gold');
  const [races, setRaces] = useState<Race[] | null>(null);

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
  const subraces = useMemo(() => {
    // Every base race also has parentRaceId === null - without this guard,
    // "no race picked yet" (draft.raceId === null) matched that same
    // condition and populated the subrace combo with the full race list
    // before the player had chosen anything.
    if (draft.raceId === null) return [];
    return sortByLocalizedName((races ?? []).filter((race) => race.parentRaceId === draft.raceId));
  }, [races, draft.raceId]);
  const selectedSubrace = useMemo(
    () => subraces.find((race) => race.id === draft.subraceId) ?? null,
    [subraces, draft.subraceId]
  );

  const isDragonborn = selectedRace?.englishName === 'Dragonborn';

  const combinedBonuses = useMemo(
    () => combineAbilityBonuses(selectedRace?.abilityBonuses ?? null, selectedSubrace?.abilityBonuses ?? null),
    [selectedRace, selectedSubrace]
  );
  // The PHB never combines more than one `choose` clause for a single
  // race+subrace pair (only Half-Elf has one at all) - see combineAbilityBonuses.
  const bonusChoiceClause = combinedBonuses.choices[0];

  const needsSubrace = subraces.length > 0 && draft.subraceId === null;
  const needsBonusChoice = bonusChoiceClause
    ? Object.values(draft.abilityBonusChoices).filter((v) => v && v > 0).length < bonusChoiceClause.count
    : false;
  const needsDraconicAncestry = isDragonborn && draft.draconicAncestry === null;
  const canProceed = draft.raceId !== null && !needsSubrace && !needsBonusChoice && !needsDraconicAncestry;

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
          value={draft.raceId !== null ? String(draft.raceId) : ''}
          options={baseRaces.map((race) => ({ value: String(race.id), label: race.name }))}
          onChange={(value) => setRace(Number(value))}
        />

        {subraces.length > 0 ? (
          <SelectField
            label="Sub-raça"
            value={draft.subraceId !== null ? String(draft.subraceId) : ''}
            options={subraces.map((race) => ({
              value: String(race.id),
              label: getSubraceDisplayName(race.englishName, race.name),
            }))}
            onChange={(value) => setSubrace(Number(value))}
          />
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

        {selectedRace ? (
          <ThemedText style={styles.bonusSummary}>{formatBonusSummary(combinedBonuses.fixed)}</ThemedText>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { borderColor: goldColor }]}>
        <Pressable
          disabled={!canProceed}
          onPress={() => router.push('/wizard/class')}
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
