import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { SelectField } from '@/components/character/select-field';
import { WizardStepHeader } from '@/components/wizard/wizard-step-header';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useWizardDraft } from '@/context/wizard-context';
import { classGrantsSubclassAtLevel1, getAllClasses, getSubclassesForClass } from '@/data/queries/classes';
import { sortByLocalizedName } from '@/utils/sort-by-name';
import type { CharacterClassDefinition, SubclassDefinition } from '@/types/reference';

export default function WizardClassStep() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { draft, setClass, setSubclass } = useWizardDraft();
  const goldColor = useThemeColor({}, 'gold');

  const [classes, setClasses] = useState<CharacterClassDefinition[] | null>(null);
  const [subclasses, setSubclasses] = useState<SubclassDefinition[] | null>(null);
  const [needsSubclassChoice, setNeedsSubclassChoice] = useState(false);

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
      if (!cancelled) setSubclasses(sortByLocalizedName(data));
    });
    return () => {
      cancelled = true;
    };
  }, [db, draft.classId]);

  const selectedClass = useMemo(() => (classes ?? []).find((c) => c.id === draft.classId) ?? null, [classes, draft.classId]);

  const canProceed = draft.classId !== null && (!needsSubclassChoice || draft.subclassId !== null);

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

        {needsSubclassChoice && subclasses ? (
          <SelectField
            label={selectedClass?.subclassTitle ?? 'Subclasse'}
            value={draft.subclassId !== null ? String(draft.subclassId) : ''}
            options={subclasses.map((s) => ({ value: String(s.id), label: s.name }))}
            onChange={(value) => setSubclass(Number(value))}
          />
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
});
