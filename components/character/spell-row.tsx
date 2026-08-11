import { StyleSheet, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { CheckboxToggle } from '@/components/character/checkbox-toggle';
import { ItemIconPlaceholder } from '@/components/character/item-icon-placeholder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface SpellRowProps {
  name: string;
  school?: string;
  ritual?: boolean;
  prepared?: boolean;
  onTogglePrepared?: () => void;
  // Dims the "Preparada" checkbox while keeping it tappable - see
  // CheckboxToggle's `dimmed` prop.
  preparedDimmed?: boolean;
  // Marks a subclass's always-prepared bonus spell (e.g. Cleric domain
  // spells) - shown next to Ritual so it's clear why the checkbox above is
  // locked checked.
  domainSpell?: boolean;
}

export function SpellRow({
  name,
  school,
  ritual = false,
  prepared,
  onTogglePrepared,
  preparedDimmed,
  domainSpell = false,
}: SpellRowProps) {
  const goldColor = useThemeColor({}, 'gold');

  return (
    <ThemedView style={[styles.card, { borderColor: goldColor }]}>
      <ItemIconPlaceholder />
      <View style={styles.info}>
        <ThemedText style={styles.name} numberOfLines={1}>
          {name}
        </ThemedText>
        {school ? (
          <ThemedText style={styles.properties} numberOfLines={1}>
            {school}
          </ThemedText>
        ) : null}
      </View>
      <View style={styles.statColumn}>
        {prepared !== undefined ? (
          <View style={styles.statRow}>
            <ThemedText style={styles.preparedLabel}>Preparada</ThemedText>
            <CheckboxToggle checked={prepared} onToggle={onTogglePrepared} dimmed={preparedDimmed} />
          </View>
        ) : null}
        {ritual ? (
          <View style={styles.statRow}>
            <MaterialCommunityIcons name="candle" size={16} color={goldColor} />
            <ThemedText style={[styles.statValue, { color: goldColor }]}>Ritual</ThemedText>
          </View>
        ) : null}
        {domainSpell ? (
          <View style={styles.statRow}>
            <MaterialCommunityIcons name="church" size={16} color={goldColor} />
            <ThemedText style={[styles.statValue, { color: goldColor }]}>Domínio</ThemedText>
          </View>
        ) : null}
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
  preparedLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
});
