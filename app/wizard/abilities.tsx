import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { AbilityMethodToggle } from '@/components/wizard/ability-method-toggle';
import { DiceRoller4d6 } from '@/components/wizard/dice-roller-4d6';
import {
  PointBuyAllocator,
  POINT_BUY_BUDGET,
  createDefaultPointBuyScores,
  getPointBuySpent,
  type PointBuyScores,
} from '@/components/wizard/point-buy-allocator';
import { STANDARD_ARRAY, StandardArrayAssigner } from '@/components/wizard/standard-array-assigner';
import { resolveAssignedScores, type ValuePoolAssignments } from '@/components/wizard/value-pool-assigner';
import { WizardStepHeader } from '@/components/wizard/wizard-step-header';
import { ABILITIES } from '@/constants/character';
import { useWizardDraft } from '@/context/wizard-context';
import { getRaceById } from '@/data/queries/races';
import { combineAbilityBonuses, getResolvedRacialBonus } from '@/data/wizard/race-ability-bonus';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { AbilityKey } from '@/types/character';
import type { Race } from '@/types/reference';

export default function WizardAbilitiesStep() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { draft, setAbilityMethod, setBaseAbilityScores } = useWizardDraft();
  const goldColor = useThemeColor({}, 'gold');

  const [race, setRace] = useState<Race | null>(null);
  const [subrace, setSubrace] = useState<Race | null>(null);
  const [racesLoaded, setRacesLoaded] = useState(false);

  const [rolledPool, setRolledPool] = useState<number[] | null>(null);
  const [rollAssignments, setRollAssignments] = useState<ValuePoolAssignments>({});
  const [arrayAssignments, setArrayAssignments] = useState<ValuePoolAssignments>({});
  const [pointBuyScores, setPointBuyScores] = useState<PointBuyScores>(createDefaultPointBuyScores());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const loadedRace = draft.raceId !== null ? await getRaceById(db, draft.raceId) : null;
      const loadedSubrace = draft.subraceId !== null ? await getRaceById(db, draft.subraceId) : null;
      if (cancelled) return;
      setRace(loadedRace);
      setSubrace(loadedSubrace);
      setRacesLoaded(true);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [db, draft.raceId, draft.subraceId]);

  const combinedBonuses = useMemo(
    () => combineAbilityBonuses(race?.abilityBonuses ?? null, subrace?.abilityBonuses ?? null),
    [race, subrace]
  );

  const baseScores: Partial<Record<AbilityKey, number>> = useMemo(() => {
    if (draft.abilityMethod === 'roll') return rolledPool ? resolveAssignedScores(rolledPool, rollAssignments) : {};
    if (draft.abilityMethod === 'array') return resolveAssignedScores(STANDARD_ARRAY, arrayAssignments);
    if (draft.abilityMethod === 'pointBuy') return pointBuyScores;
    return {};
  }, [draft.abilityMethod, rolledPool, rollAssignments, arrayAssignments, pointBuyScores]);

  // Push the resolved base scores up to the draft whenever they change, so
  // the wizard's own state is the source of truth once this step is left.
  useEffect(() => {
    setBaseAbilityScores(baseScores);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseScores]);

  const allAbilitiesAssigned = ABILITIES.every((ability) => baseScores[ability.key] !== undefined);
  const pointBuySpentOk = draft.abilityMethod !== 'pointBuy' || getPointBuySpent(pointBuyScores) <= POINT_BUY_BUDGET;
  const canProceed = draft.abilityMethod !== null && allAbilitiesAssigned && pointBuySpentOk;

  if (!racesLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={goldColor} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <WizardStepHeader step={3} title="Atributos" subtitle="Escolha como determinar os valores de atributo." />

        <AbilityMethodToggle value={draft.abilityMethod} onChange={setAbilityMethod} />

        {draft.abilityMethod === 'roll' ? (
          <DiceRoller4d6
            pool={rolledPool}
            assignments={rollAssignments}
            onRoll={(pool) => {
              setRolledPool(pool);
              setRollAssignments({});
            }}
            onChangeAssignments={setRollAssignments}
          />
        ) : null}

        {draft.abilityMethod === 'array' ? (
          <StandardArrayAssigner assignments={arrayAssignments} onChange={setArrayAssignments} />
        ) : null}

        {draft.abilityMethod === 'pointBuy' ? (
          <PointBuyAllocator scores={pointBuyScores} onChange={setPointBuyScores} />
        ) : null}

        {allAbilitiesAssigned ? (
          <View style={styles.summarySection}>
            <ThemedText type="subtitle" style={styles.summaryTitle}>
              Resultado final
            </ThemedText>
            {ABILITIES.map((ability) => {
              const base = baseScores[ability.key] ?? 0;
              const racialBonus = getResolvedRacialBonus(combinedBonuses, draft.abilityBonusChoices, ability.key);
              return (
                <View key={ability.key} style={styles.summaryRow}>
                  <ThemedText style={styles.summaryLabel}>{ability.label}</ThemedText>
                  <ThemedText style={styles.summaryValue}>
                    {base} {racialBonus !== 0 ? `+ ${racialBonus} (racial)` : ''} = {base + racialBonus}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { borderColor: goldColor }]}>
        <Pressable
          disabled={!canProceed}
          onPress={() => router.push('/wizard/background')}
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
  summarySection: {
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryValue: {
    fontSize: 14,
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
