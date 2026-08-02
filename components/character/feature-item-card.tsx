import { StyleSheet, View } from 'react-native';

import { ItemIconPlaceholder } from '@/components/character/item-icon-placeholder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface FeatureItemCardProps {
  name: string;
  usageType: 'ativa' | 'passiva';
  maxUses?: string;
  usesCurrent?: string;
  recovery?: string;
}

export function FeatureItemCard({ name, usageType, maxUses, usesCurrent, recovery }: FeatureItemCardProps) {
  const goldColor = useThemeColor({}, 'gold');
  const isPassive = usageType === 'passiva';

  return (
    <ThemedView style={[styles.card, { borderColor: goldColor }]}>
      <ItemIconPlaceholder badge={maxUses ? `${usesCurrent}/${maxUses}` : undefined} />
      <View style={styles.info}>
        <ThemedText style={styles.name} numberOfLines={1}>
          {name}
        </ThemedText>
        <ThemedText style={styles.properties}>{isPassive ? 'Passiva' : 'Ativa'}</ThemedText>
      </View>
      <View style={styles.statRow}>
        <ThemedText style={styles.recoveryLabel} numberOfLines={1}>
          {`Recarga: ${isPassive ? '-' : recovery}`}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  properties: {
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recoveryLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
});
