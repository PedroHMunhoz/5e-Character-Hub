import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { AbilityMethodToggle } from '@/components/wizard/ability-method-toggle';
import { DiceRoller4d6 } from '@/components/wizard/dice-roller-4d6';
import { FeatChoice } from '@/components/wizard/feat-choice';
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
import { CLASS_INFO, formatAbilitySlot } from '@/constants/class-info';
import { RACES_THAT_GRANT_A_FEAT } from '@/constants/race-feat-grants';
import { useWizardDraft } from '@/context/wizard-context';
import { parseClassArmorProficiencies, parseRaceArmorProficiencies } from '@/data/wizard/armor-proficiency-resolver';
import { getClassById, getClassEnglishName } from '@/data/queries/classes';
import { getAllFeats } from '@/data/queries/feats';
import { getRaceById } from '@/data/queries/races';
import { getFeatAbilityChoice } from '@/data/wizard/feat-ability-bonus';
import { meetsFeatPrerequisite, type FeatPrerequisiteContext } from '@/data/wizard/feat-prerequisites';
import { combineAbilityBonuses, getResolvedRacialBonus } from '@/data/wizard/race-ability-bonus';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { AbilityKey, ArmorCategory } from '@/types/character';
import type { CharacterClassDefinition, Feat, Race } from '@/types/reference';

export default function WizardAbilitiesStep() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { draft, setAbilityMethod, setBaseAbilityScores, setFeat, setFeatAbilityChoice } = useWizardDraft();
  const goldColor = useThemeColor({}, 'gold');

  const [race, setRace] = useState<Race | null>(null);
  const [subrace, setSubrace] = useState<Race | null>(null);
  const [racesLoaded, setRacesLoaded] = useState(false);
  const [classDef, setClassDef] = useState<CharacterClassDefinition | null>(null);
  const [classEnglishName, setClassEnglishName] = useState<string | null>(null);
  const [feats, setFeats] = useState<Feat[] | null>(null);

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

  useEffect(() => {
    if (draft.classId === null) {
      setClassDef(null);
      setClassEnglishName(null);
      return;
    }
    let cancelled = false;
    async function load() {
      const loadedClass = await getClassById(db, draft.classId!);
      const loadedEnglishName = await getClassEnglishName(db, draft.classId!);
      if (cancelled) return;
      setClassDef(loadedClass);
      setClassEnglishName(loadedEnglishName);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [db, draft.classId]);

  useEffect(() => {
    let cancelled = false;
    getAllFeats(db).then((data) => {
      if (!cancelled) setFeats(data);
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  const classInfo = classEnglishName ? (CLASS_INFO[classEnglishName] ?? null) : null;
  const abilitiesSubtitle =
    classDef && classInfo
      ? `Escolha como determinar os valores de atributo. Sua classe escolhida foi ${classDef.name}, então distribua os pontos preferencialmente nesta ordem: ${formatAbilitySlot(classInfo.primaryAbility)}, depois ${formatAbilitySlot(classInfo.secondaryAbility)}.`
      : 'Escolha como determinar os valores de atributo.';

  // Variant Human REPLACES the standard Human's own fixed "+1 to all six"
  // bonus - see the identical note in app/wizard/index.tsx.
  const isVariantHuman = subrace?.englishName === 'Variant';
  const combinedBonuses = useMemo(
    () => combineAbilityBonuses(isVariantHuman ? null : (race?.abilityBonuses ?? null), subrace?.abilityBonuses ?? null),
    [race, subrace, isVariantHuman]
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

  // Variant Human (the only PHB case - see constants/race-feat-grants.ts)
  // grants a feat, but RAW doesn't waive its prerequisite - so the pick only
  // shows up once final ability scores exist (this step) and is filtered to
  // what the character actually qualifies for (also needs the class, chosen
  // in the previous step, for armor proficiency/spellcasting checks).
  const grantsFeat = subrace !== null && RACES_THAT_GRANT_A_FEAT.has(subrace.englishName);

  const totalAbilityScores = Object.fromEntries(
    ABILITIES.map((ability) => [
      ability.key,
      (baseScores[ability.key] ?? 0) + getResolvedRacialBonus(combinedBonuses, draft.abilityBonusChoices, ability.key),
    ])
  ) as Record<AbilityKey, number>;

  // startingProficiencies is the whole raw DSL object ({weapons, armor,
  // tools, skills, ...}), not just the armor array - same cast pattern
  // already used by app/wizard/background.tsx for .skills/.toolProficiencies.
  const classArmorField = (classDef?.startingProficiencies as { armor?: unknown } | null)?.armor;
  const armorProficiencies = new Set<ArmorCategory>([
    ...parseClassArmorProficiencies(classArmorField),
    ...parseRaceArmorProficiencies(race?.armorProficiencies),
    ...parseRaceArmorProficiencies(subrace?.armorProficiencies),
  ]);

  const featPrerequisiteContext: FeatPrerequisiteContext = {
    abilityScores: totalAbilityScores,
    armorProficiencies,
    canCastSpells: classDef?.spellcastingAbility != null,
  };

  const eligibleFeats =
    grantsFeat && allAbilitiesAssigned && feats !== null
      ? feats.filter((feat) => meetsFeatPrerequisite(feat.prerequisite, featPrerequisiteContext))
      : [];

  // The player went back and changed abilities/class after picking a feat
  // that no longer qualifies (e.g. dropped below a Strength prerequisite) -
  // clear it rather than leaving an invalid pick silently in the draft.
  useEffect(() => {
    if (!grantsFeat || draft.featId === null) return;
    if (eligibleFeats.length === 0) return; // still loading - don't clear based on an empty list
    if (!eligibleFeats.some((feat) => feat.id === draft.featId)) {
      setFeat(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grantsFeat, draft.featId, eligibleFeats]);

  const selectedFeat = eligibleFeats.find((feat) => feat.id === draft.featId) ?? null;
  const selectedFeatAbilityClause = selectedFeat ? getFeatAbilityChoice(selectedFeat.ability) : null;
  const needsFeat =
    grantsFeat &&
    allAbilitiesAssigned &&
    (draft.featId === null || (selectedFeatAbilityClause !== null && draft.featAbilityChoice === null));

  const canProceed = draft.abilityMethod !== null && allAbilitiesAssigned && pointBuySpentOk && !needsFeat;

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
        <WizardStepHeader step={3} title="Atributos" subtitle={abilitiesSubtitle} />

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

        {grantsFeat && allAbilitiesAssigned ? (
          <View style={styles.summarySection}>
            <ThemedText type="subtitle" style={styles.summaryTitle}>
              Talento
            </ThemedText>
            {feats === null ? (
              <ActivityIndicator color={goldColor} />
            ) : (
              <FeatChoice
                eligibleFeats={eligibleFeats}
                featId={draft.featId}
                onSelectFeat={setFeat}
                abilityChoice={draft.featAbilityChoice}
                onSelectAbilityChoice={setFeatAbilityChoice}
              />
            )}
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
