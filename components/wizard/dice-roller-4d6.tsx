import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { rollAbilityScoreSet } from '@/utils/dice';
import { ValuePoolAssigner, type ValuePoolAssignments } from '@/components/wizard/value-pool-assigner';

interface DiceRoller4d6Props {
  pool: number[] | null;
  assignments: ValuePoolAssignments;
  onRoll: (pool: number[]) => void;
  onChangeAssignments: (next: ValuePoolAssignments) => void;
}

// Rolls 4d6 drop-lowest six times, then lets the player assign each result
// to one of the six abilities via ValuePoolAssigner.
export function DiceRoller4d6({ pool, assignments, onRoll, onChangeAssignments }: DiceRoller4d6Props) {
  const goldColor = useThemeColor({}, 'gold');

  return (
    <View style={styles.container}>
      <Pressable onPress={() => onRoll(rollAbilityScoreSet())} style={[styles.rollButton, { borderColor: goldColor }]}>
        <ThemedText style={[styles.rollButtonText, { color: goldColor }]}>
          {pool ? 'Rolar novamente' : 'Rolar 4d6 (x6)'}
        </ThemedText>
      </Pressable>

      {pool ? (
        <>
          <View style={styles.rolledRow}>
            {pool.map((value, index) => (
              <View key={index} style={[styles.rolledPip, { borderColor: goldColor }]}>
                <ThemedText style={styles.rolledValue}>{value}</ThemedText>
              </View>
            ))}
          </View>
          <ValuePoolAssigner pool={pool} assignments={assignments} onChange={onChangeAssignments} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  rollButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rollButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  rolledRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  rolledPip: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rolledValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});
