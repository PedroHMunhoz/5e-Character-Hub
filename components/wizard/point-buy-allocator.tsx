import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ABILITIES } from '@/constants/character';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { AbilityKey } from '@/types/character';

// PHB point-buy table (p.13): 27-point budget, every ability starts at 8,
// scores 9-13 cost 1 point each, 14-15 cost 2 points each (cumulative costs
// below), range capped at 8-15 before racial bonuses.
const POINT_BUY_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const POINT_BUY_BUDGET = 27;
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;

export type PointBuyScores = Record<AbilityKey, number>;

export function createDefaultPointBuyScores(): PointBuyScores {
  return { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
}

export function getPointBuySpent(scores: PointBuyScores): number {
  return ABILITIES.reduce((sum, ability) => sum + POINT_BUY_COST[scores[ability.key]], 0);
}

interface PointBuyAllocatorProps {
  scores: PointBuyScores;
  onChange: (next: PointBuyScores) => void;
}

export function PointBuyAllocator({ scores, onChange }: PointBuyAllocatorProps) {
  const goldColor = useThemeColor({}, 'gold');
  const spent = getPointBuySpent(scores);
  const remaining = POINT_BUY_BUDGET - spent;

  function adjust(key: AbilityKey, delta: number) {
    const next = scores[key] + delta;
    if (next < POINT_BUY_MIN || next > POINT_BUY_MAX) return;
    const deltaCost = POINT_BUY_COST[next] - POINT_BUY_COST[scores[key]];
    if (deltaCost > remaining) return;
    onChange({ ...scores, [key]: next });
  }

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.remaining, { color: goldColor }]}>Pontos restantes: {remaining}</ThemedText>

      {ABILITIES.map((ability) => {
        const score = scores[ability.key];
        return (
          <View key={ability.key} style={styles.row}>
            <ThemedText style={styles.label}>{ability.label}</ThemedText>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => adjust(ability.key, -1)}
                disabled={score <= POINT_BUY_MIN}
                style={[styles.stepButton, { borderColor: goldColor, opacity: score <= POINT_BUY_MIN ? 0.3 : 1 }]}
              >
                <ThemedText style={[styles.stepButtonText, { color: goldColor }]}>-</ThemedText>
              </Pressable>
              <ThemedText style={styles.value}>{score}</ThemedText>
              <Pressable
                onPress={() => adjust(ability.key, 1)}
                disabled={score >= POINT_BUY_MAX || POINT_BUY_COST[score + 1] - POINT_BUY_COST[score] > remaining}
                style={[
                  styles.stepButton,
                  {
                    borderColor: goldColor,
                    opacity: score >= POINT_BUY_MAX || POINT_BUY_COST[score + 1] - POINT_BUY_COST[score] > remaining ? 0.3 : 1,
                  },
                ]}
              >
                <ThemedText style={[styles.stepButtonText, { color: goldColor }]}>+</ThemedText>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  remaining: {
    fontSize: 15,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 15,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
});
