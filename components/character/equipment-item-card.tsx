import { StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { CheckboxToggle } from '@/components/character/checkbox-toggle';
import { ItemIconPlaceholder } from '@/components/character/item-icon-placeholder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface EquipmentItemCardProps {
  name: string;
  properties?: string;
  weight: string;
  statValue?: string;
  statIcon: 'sword' | 'shield';
  equipped: boolean;
  onToggleEquipped: () => void;
}

export function EquipmentItemCard({
  name,
  properties,
  weight,
  statValue,
  statIcon,
  equipped,
  onToggleEquipped,
}: EquipmentItemCardProps) {
  const goldColor = useThemeColor({}, 'gold');

  return (
    <ThemedView style={[styles.card, { borderColor: goldColor }]}>
      <ItemIconPlaceholder />
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
      <View style={styles.statColumn}>
        <View style={styles.statRow}>
          <ThemedText style={styles.equippedLabel}>Equipado</ThemedText>
          <CheckboxToggle checked={equipped} onToggle={onToggleEquipped} />
        </View>
        <View style={styles.statRow}>
          <MaterialCommunityIcons name={statIcon} size={16} color={goldColor} />
          <ThemedText style={[styles.statValue, { color: goldColor }]}>{statValue}</ThemedText>
        </View>
        <View style={styles.statRow}>
          <MaterialCommunityIcons name="weight-kilogram" size={16} color={goldColor} />
          <ThemedText style={styles.weightValue}>{weight}</ThemedText>
        </View>
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
  statColumn: {
    gap: 6,
    alignItems: 'flex-end',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  equippedLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  weightValue: {
    fontSize: 14,
  },
});
