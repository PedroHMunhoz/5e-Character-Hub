import { StyleSheet, View } from 'react-native';

import { SelectField } from '@/components/character/select-field';
import { ABILITIES } from '@/constants/character';
import type { AbilityKey } from '@/types/character';

// Shared by the "Rolagem 4d6" and "Array Fixo" ability-score methods: both
// boil down to assigning a fixed pool of 6 numbers to the 6 abilities,
// one-to-one. Assignments are tracked by pool INDEX (not value) so two
// equal rolled values (e.g. two 13s) are still distinguishable - only the
// index is removed from availability when assigned, not the value.
export type ValuePoolAssignments = Partial<Record<AbilityKey, number>>;

interface ValuePoolAssignerProps {
  pool: number[];
  assignments: ValuePoolAssignments;
  onChange: (next: ValuePoolAssignments) => void;
}

export function ValuePoolAssigner({ pool, assignments, onChange }: ValuePoolAssignerProps) {
  const usedIndexes = new Set(Object.values(assignments));

  return (
    <View style={styles.grid}>
      {ABILITIES.map((ability) => {
        const myIndex = assignments[ability.key];
        const availableIndexes = pool
          .map((_, index) => index)
          .filter((index) => index === myIndex || !usedIndexes.has(index));

        return (
          <SelectField
            key={ability.key}
            label={ability.label}
            value={myIndex !== undefined ? String(myIndex) : ''}
            options={availableIndexes.map((index) => ({ value: String(index), label: String(pool[index]) }))}
            onChange={(value) => {
              const next = { ...assignments };
              if (value === '') {
                delete next[ability.key];
              } else {
                next[ability.key] = Number(value);
              }
              onChange(next);
            }}
            allowClear
          />
        );
      })}
    </View>
  );
}

export function resolveAssignedScores(pool: number[], assignments: ValuePoolAssignments): Partial<Record<AbilityKey, number>> {
  const scores: Partial<Record<AbilityKey, number>> = {};
  for (const ability of ABILITIES) {
    const index = assignments[ability.key];
    if (index !== undefined) scores[ability.key] = pool[index];
  }
  return scores;
}

const styles = StyleSheet.create({
  grid: {
    gap: 10,
  },
});
