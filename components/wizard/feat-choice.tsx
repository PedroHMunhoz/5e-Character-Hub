import { StyleSheet, View } from 'react-native';

import { AbilityBonusChoice } from '@/components/wizard/ability-bonus-choice';
import { SelectField } from '@/components/character/select-field';
import { ThemedText } from '@/components/themed-text';
import { getFeatAbilityChoice } from '@/data/wizard/feat-ability-bonus';
import { useThemeColor } from '@/hooks/use-theme-color';
import { sortByLocalizedName } from '@/utils/sort-by-name';
import type { AbilityKey } from '@/types/character';
import type { Feat } from '@/types/reference';

interface FeatChoiceProps {
  // Already filtered to feats whose prerequisite the character meets (see
  // data/wizard/feat-prerequisites.ts) - this component doesn't re-check
  // eligibility, only presents the pick.
  eligibleFeats: Feat[];
  featId: number | null;
  onSelectFeat: (featId: number) => void;
  abilityChoice: AbilityKey | null;
  onSelectAbilityChoice: (ability: AbilityKey | null) => void;
}

// Presents a single "choose a feat" pick, plus the feat's own ability-bonus
// sub-choice when it has one (e.g. Athlete's "Strength or Dexterity").
// Deliberately standalone (no wizard-context dependency) so it can be
// reused by a future level-up flow, not just Variant Human at creation -
// see docs/TODO.md / the "Implementar o Lvl Up de personagem" Trello card.
export function FeatChoice({
  eligibleFeats,
  featId,
  onSelectFeat,
  abilityChoice,
  onSelectAbilityChoice,
}: FeatChoiceProps) {
  const goldColor = useThemeColor({}, 'gold');
  const sortedFeats = sortByLocalizedName(eligibleFeats);
  const selectedFeat = eligibleFeats.find((feat) => feat.id === featId) ?? null;
  const abilityClause = selectedFeat ? getFeatAbilityChoice(selectedFeat.ability) : null;

  return (
    <View style={styles.container}>
      <ThemedText style={styles.hint}>
        Só aparecem talentos cujo pré-requisito você já atende (atributos e proficiências atuais).
      </ThemedText>

      <SelectField
        label="Talento"
        value={featId !== null ? String(featId) : ''}
        options={sortedFeats.map((feat) => ({ value: String(feat.id), label: feat.name }))}
        onChange={(value) => onSelectFeat(Number(value))}
      />

      {selectedFeat ? (
        <View style={[styles.field, { borderColor: goldColor }]}>
          {selectedFeat.entries.map((entry, index) => (
            <ThemedText key={index} style={styles.descriptionParagraph}>
              {entry}
            </ThemedText>
          ))}
        </View>
      ) : null}

      {abilityClause ? (
        <AbilityBonusChoice
          clause={abilityClause}
          selected={abilityChoice ? [abilityChoice] : []}
          onChange={(selected) => onSelectAbilityChoice(selected[0] ?? null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  hint: {
    fontSize: 13,
    opacity: 0.7,
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
});
