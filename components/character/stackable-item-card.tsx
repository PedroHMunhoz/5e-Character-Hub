import { StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { ItemIconPlaceholder } from '@/components/character/item-icon-placeholder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface StackableItemCardProps {
  name: string;
  properties?: string;
  weight: string;
  quantity?: string;
}

export function StackableItemCard({ name, properties, weight, quantity }: StackableItemCardProps) {
  const goldColor = useThemeColor({}, 'gold');

  return (
    <ThemedView style={[styles.card, { borderColor: goldColor }]}>
      <ItemIconPlaceholder badge={quantity} />
      <View style={styles.info}>
        <ThemedText style={styles.name} numberOfLines={1}>
          {name}
        </ThemedText>
        {properties ? (
          <ThemedText style={styles.properties} numberOfLines={2}>
            {properties}
          </ThemedText>
        ) : null}
      </View>
      <View style={styles.statRow}>
        <MaterialCommunityIcons name="weight-kilogram" size={16} color={goldColor} />
        <ThemedText style={styles.weightValue}>{weight}</ThemedText>
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
  weightValue: {
    fontSize: 14,
  },
});
