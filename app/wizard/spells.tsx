import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { SpellPicker } from '@/components/wizard/spell-picker';
import { WizardStepHeader } from '@/components/wizard/wizard-step-header';
import { SPELLCASTING_RULES } from '@/constants/spellcasting';
import { useWizardDraft } from '@/context/wizard-context';
import { getClassById, getClassEnglishName } from '@/data/queries/classes';
import { getRaceById } from '@/data/queries/races';
import { combineAbilityBonuses, getResolvedRacialBonus } from '@/data/wizard/race-ability-bonus';
import { getSpellsForClass } from '@/data/queries/spells';
import { useThemeColor } from '@/hooks/use-theme-color';
import { sortByLocalizedName } from '@/utils/sort-by-name';
import { getPreparedSpellCount } from '@/utils/spellcasting';
import type { AbilityKey } from '@/types/character';
import type { Spell } from '@/types/reference';

export default function WizardSpellsStep() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { draft, setSpellIds } = useWizardDraft();
  const goldColor = useThemeColor({}, 'gold');

  const [status, setStatus] = useState<'loading' | 'notApplicable' | 'ready'>('loading');
  const [spells, setSpells] = useState<Spell[]>([]);
  const [preparedCount, setPreparedCount] = useState(1);
  const [ruleKey, setRuleKey] = useState<string | null>(null);

  const [selectedCantrips, setSelectedCantrips] = useState<number[]>([]);
  const [selectedLevel1, setSelectedLevel1] = useState<number[]>([]);

  useEffect(() => {
    if (draft.classId === null) return;
    let cancelled = false;

    async function load() {
      const classDef = await getClassById(db, draft.classId!);
      const englishName = await getClassEnglishName(db, draft.classId!);
      if (cancelled || !classDef) return;

      const isLevel1Caster = classDef.casterProgression === 'full' || classDef.casterProgression === 'pact';
      const rule = englishName ? SPELLCASTING_RULES[englishName] : undefined;
      if (!isLevel1Caster || !rule || !englishName) {
        setStatus('notApplicable');
        return;
      }

      setRuleKey(englishName);

      const classSpells = await getSpellsForClass(db, englishName);
      if (cancelled) return;
      setSpells(classSpells);

      if (rule.preparedFromFullList && classDef.spellcastingAbility) {
        const abilityKey = classDef.spellcastingAbility as AbilityKey;
        const race = draft.raceId !== null ? await getRaceById(db, draft.raceId) : null;
        const subrace = draft.subraceId !== null ? await getRaceById(db, draft.subraceId) : null;
        if (cancelled) return;
        const combined = combineAbilityBonuses(race?.abilityBonuses ?? null, subrace?.abilityBonuses ?? null);
        const racialBonus = getResolvedRacialBonus(combined, draft.abilityBonusChoices, abilityKey);
        const base = draft.baseAbilityScores[abilityKey] ?? 10;
        const modifier = Math.floor((base + racialBonus - 10) / 2);
        setPreparedCount(getPreparedSpellCount(modifier, 1));
      }

      setStatus('ready');
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, draft.classId]);

  useEffect(() => {
    if (status === 'notApplicable') {
      router.replace('/wizard/details');
    }
  }, [status, router]);

  const rule = ruleKey ? SPELLCASTING_RULES[ruleKey] : undefined;
  const cantrips = useMemo(() => sortByLocalizedName(spells.filter((spell) => spell.level === 0)), [spells]);
  const level1Spells = useMemo(() => sortByLocalizedName(spells.filter((spell) => spell.level === 1)), [spells]);
  const level1Count = rule?.spellsKnownFixed ?? preparedCount;

  const canProceed =
    status === 'ready' &&
    rule !== undefined &&
    selectedCantrips.length === rule.cantripsKnown &&
    selectedLevel1.length === level1Count;

  function handleNext() {
    setSpellIds([...selectedCantrips, ...selectedLevel1]);
    router.push('/wizard/details');
  }

  if (status === 'loading' || status === 'notApplicable') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={goldColor} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <WizardStepHeader
          step={6}
          title="Magias"
          subtitle={rule?.preparedFromFullList ? 'Escolha as magias preparadas para hoje.' : 'Escolha as magias conhecidas.'}
        />

        {rule ? (
          <SpellPicker
            title="Truques"
            spells={cantrips}
            count={rule.cantripsKnown}
            selected={selectedCantrips}
            onChange={setSelectedCantrips}
          />
        ) : null}

        <SpellPicker
          title="Magias de 1º nível"
          spells={level1Spells}
          count={level1Count}
          selected={selectedLevel1}
          onChange={setSelectedLevel1}
        />
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
