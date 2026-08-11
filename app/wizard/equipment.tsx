import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { EquipmentChoiceGroupView } from '@/components/wizard/equipment-choice-group';
import { WizardStepHeader } from '@/components/wizard/wizard-step-header';
import { useWizardDraft, type EquipmentMode } from '@/context/wizard-context';
import { getBackgroundById } from '@/data/queries/backgrounds';
import { getClassById } from '@/data/queries/classes';
import type { EquipmentLookupItem } from '@/data/queries/equipment-lookup';
import { getAllToolItems } from '@/data/queries/tools';
import {
  parseBackgroundEquipment,
  parseClassEquipment,
  resolveEquipmentItemRefs,
  type EquipmentChoiceGroup,
  type ResolvedEquipmentEntry,
} from '@/data/wizard/equipment-resolver';
import { buildToolCategoryIndex, categorizeGrantedTools, reconcileEquipmentGroup } from '@/data/wizard/tool-equipment-overlap';
import { formatGoldFormula, rollGoldFormula } from '@/utils/dice';
import { useThemeColor } from '@/hooks/use-theme-color';

function resolveEntry(entry: ResolvedEquipmentEntry, entryKey: string, categoryChoices: Record<string, EquipmentLookupItem>): ResolvedEquipmentEntry {
  if (entry.kind !== 'categoryChoice') return entry;
  const chosen = categoryChoices[entryKey];
  if (!chosen) return entry;
  return { kind: 'item', itemId: chosen.id, source: chosen.source, name: chosen.name, quantity: entry.quantity };
}

function isGroupResolved(
  group: EquipmentChoiceGroup,
  groupKey: string,
  selectedOptionKeys: Record<string, string>,
  categoryChoices: Record<string, EquipmentLookupItem>
): boolean {
  if (group.kind === 'fixed') {
    return group.entries.every((entry, i) => entry.kind !== 'categoryChoice' || categoryChoices[`${groupKey}-fixed-${i}`] != null);
  }
  const optionKey = selectedOptionKeys[groupKey];
  if (!optionKey) return false;
  const option = group.options.find((o) => o.key === optionKey);
  if (!option) return false;
  return option.entries.every((entry, i) => entry.kind !== 'categoryChoice' || categoryChoices[`${groupKey}-${optionKey}-${i}`] != null);
}

function resolveGroupEntries(
  group: EquipmentChoiceGroup,
  groupKey: string,
  selectedOptionKeys: Record<string, string>,
  categoryChoices: Record<string, EquipmentLookupItem>
): ResolvedEquipmentEntry[] {
  if (group.kind === 'fixed') {
    return group.entries.map((entry, i) => resolveEntry(entry, `${groupKey}-fixed-${i}`, categoryChoices));
  }
  const optionKey = selectedOptionKeys[groupKey];
  const option = group.options.find((o) => o.key === optionKey);
  if (!option) return [];
  return option.entries.map((entry, i) => resolveEntry(entry, `${groupKey}-${optionKey}-${i}`, categoryChoices));
}

export default function WizardEquipmentStep() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { draft, setEquipmentMode, setChosenEquipment, setGoldRolled } = useWizardDraft();
  const goldColor = useThemeColor({}, 'gold');

  const [classGroups, setClassGroups] = useState<EquipmentChoiceGroup[] | null>(null);
  const [backgroundGroups, setBackgroundGroups] = useState<EquipmentChoiceGroup[] | null>(null);
  const [goldAlternative, setGoldAlternative] = useState<string | undefined>(undefined);

  const [selectedOptionKeys, setSelectedOptionKeys] = useState<Record<string, string>>({});
  const [categoryChoices, setCategoryChoices] = useState<Record<string, EquipmentLookupItem>>({});

  useEffect(() => {
    if (draft.classId === null || draft.backgroundId === null) return;
    let cancelled = false;
    async function load() {
      const loadedClass = await getClassById(db, draft.classId!);
      const loadedBackground = await getBackgroundById(db, draft.backgroundId!);
      if (cancelled) return;

      const { groups: parsedClassGroups, goldAlternative: gold } = parseClassEquipment(loadedClass?.startingEquipment);
      const parsedBackgroundGroups = parseBackgroundEquipment(loadedBackground?.startingEquipment);
      setGoldAlternative(gold);

      const resolvedClassGroups = await resolveEquipmentItemRefs(db, parsedClassGroups);
      if (cancelled) return;
      const resolvedBackgroundGroups = await resolveEquipmentItemRefs(db, parsedBackgroundGroups);
      if (cancelled) return;

      // Reconcile against tools already chosen in the Antecedente step
      // (draft.toolProficiencies) - a categoryChoice here whose category
      // matches an already-granted tool becomes a fixed entry instead of
      // asking the player to pick again (see
      // data/wizard/tool-equipment-overlap.ts).
      const allTools = await getAllToolItems(db);
      if (cancelled) return;
      const grantedByCategory = categorizeGrantedTools(draft.toolProficiencies, allTools);
      const toolCategoryByKey = buildToolCategoryIndex(allTools);

      const autoSelections: Record<string, string> = {};
      const reconciledClassGroups = resolvedClassGroups.map((group, i) => {
        const { group: reconciled, autoSelectOptionKey } = reconcileEquipmentGroup(group, grantedByCategory, toolCategoryByKey);
        if (autoSelectOptionKey) autoSelections[`class-${i}`] = autoSelectOptionKey;
        return reconciled;
      });
      const reconciledBackgroundGroups = resolvedBackgroundGroups.map((group, i) => {
        const { group: reconciled, autoSelectOptionKey } = reconcileEquipmentGroup(group, grantedByCategory, toolCategoryByKey);
        if (autoSelectOptionKey) autoSelections[`background-${i}`] = autoSelectOptionKey;
        return reconciled;
      });

      setClassGroups(reconciledClassGroups);
      setBackgroundGroups(reconciledBackgroundGroups);
      // Pre-select (but don't lock) the option matching an already-granted
      // tool - only fills keys the player hasn't already chosen, so it
      // never overwrites a manual pick.
      if (Object.keys(autoSelections).length > 0) {
        setSelectedOptionKeys((prev) => {
          const next = { ...prev };
          for (const [key, value] of Object.entries(autoSelections)) {
            if (next[key] === undefined) next[key] = value;
          }
          return next;
        });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [db, draft.classId, draft.backgroundId, draft.toolProficiencies]);

  const backgroundResolved = (backgroundGroups ?? []).every((group, i) =>
    isGroupResolved(group, `background-${i}`, selectedOptionKeys, categoryChoices)
  );
  const classResolved = (classGroups ?? []).every((group, i) =>
    isGroupResolved(group, `class-${i}`, selectedOptionKeys, categoryChoices)
  );

  const canProceed =
    draft.equipmentMode !== null &&
    backgroundGroups !== null &&
    backgroundResolved &&
    (draft.equipmentMode === 'gold' ? draft.goldRolled !== null : classGroups !== null && classResolved);

  function handleModeChange(mode: EquipmentMode) {
    setEquipmentMode(mode);
    if (mode === 'gold' && draft.goldRolled === null && goldAlternative) {
      setGoldRolled(rollGoldFormula(goldAlternative));
    }
  }

  function handleNext() {
    if (!canProceed || !backgroundGroups) return;

    const backgroundEntries = backgroundGroups.flatMap((group, i) =>
      resolveGroupEntries(group, `background-${i}`, selectedOptionKeys, categoryChoices)
    );
    const classEntries =
      draft.equipmentMode === 'starting' && classGroups
        ? classGroups.flatMap((group, i) => resolveGroupEntries(group, `class-${i}`, selectedOptionKeys, categoryChoices))
        : [];

    setChosenEquipment([...classEntries, ...backgroundEntries]);
    router.push('/wizard/spells');
  }

  if (classGroups === null || backgroundGroups === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={goldColor} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <WizardStepHeader step={5} title="Equipamento" />

        <View style={styles.modeRow}>
          <Pressable
            onPress={() => handleModeChange('starting')}
            style={[
              styles.modePill,
              { borderColor: goldColor },
              draft.equipmentMode === 'starting' ? { backgroundColor: goldColor } : undefined,
            ]}
          >
            <ThemedText style={draft.equipmentMode === 'starting' ? styles.modeLabelSelected : { color: goldColor }}>
              Equipamento inicial
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={() => handleModeChange('gold')}
            style={[
              styles.modePill,
              { borderColor: goldColor },
              draft.equipmentMode === 'gold' ? { backgroundColor: goldColor } : undefined,
            ]}
          >
            <ThemedText style={draft.equipmentMode === 'gold' ? styles.modeLabelSelected : { color: goldColor }}>
              Comprar com PO
            </ThemedText>
          </Pressable>
        </View>

        {draft.equipmentMode === 'gold' ? (
          <View style={styles.goldSection}>
            <ThemedText style={styles.goldText}>
              Fórmula da classe: {goldAlternative ? formatGoldFormula(goldAlternative) : '—'}
            </ThemedText>
            <ThemedText style={[styles.goldValue, { color: goldColor }]}>
              {draft.goldRolled !== null ? `${draft.goldRolled} PO` : '—'}
            </ThemedText>
            <Pressable
              onPress={() => goldAlternative && setGoldRolled(rollGoldFormula(goldAlternative))}
              style={[styles.rollButton, { borderColor: goldColor }]}
            >
              <ThemedText style={{ color: goldColor }}>Rolar novamente</ThemedText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Equipamento de classe
            </ThemedText>
            {classGroups.map((group, i) => (
              <View key={i} style={styles.groupBlock}>
                {classGroups.length > 1 ? (
                  <ThemedText style={styles.groupSubtitle}>Equipamento {i + 1}</ThemedText>
                ) : null}
                <EquipmentChoiceGroupView
                  group={group}
                  groupKey={`class-${i}`}
                  selectedOptionKey={selectedOptionKeys[`class-${i}`] ?? null}
                  onSelectOption={(optionKey) =>
                    setSelectedOptionKeys((prev) => ({ ...prev, [`class-${i}`]: optionKey }))
                  }
                  categoryChoices={categoryChoices}
                  onChangeCategoryChoice={(entryKey, item) =>
                    setCategoryChoices((prev) => ({ ...prev, [entryKey]: item }))
                  }
                />
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Equipamento de antecedente
          </ThemedText>
          {backgroundGroups.map((group, i) => (
            <View key={i} style={styles.groupBlock}>
              {backgroundGroups.length > 1 ? (
                <ThemedText style={styles.groupSubtitle}>Equipamento {i + 1}</ThemedText>
              ) : null}
              <EquipmentChoiceGroupView
                group={group}
                groupKey={`background-${i}`}
                selectedOptionKey={selectedOptionKeys[`background-${i}`] ?? null}
                onSelectOption={(optionKey) =>
                  setSelectedOptionKeys((prev) => ({ ...prev, [`background-${i}`]: optionKey }))
                }
                categoryChoices={categoryChoices}
                onChangeCategoryChoice={(entryKey, item) =>
                  setCategoryChoices((prev) => ({ ...prev, [entryKey]: item }))
                }
              />
            </View>
          ))}
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
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modePill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeLabelSelected: {
    color: '#000',
    fontWeight: '700',
  },
  goldSection: {
    gap: 8,
    alignItems: 'flex-start',
  },
  goldText: {
    fontSize: 14,
  },
  goldValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  rollButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
  },
  groupBlock: {
    gap: 6,
  },
  groupSubtitle: {
    fontSize: 13,
    fontWeight: '600',
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
