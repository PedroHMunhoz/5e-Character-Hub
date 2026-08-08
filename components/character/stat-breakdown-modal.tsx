import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface StatBreakdownRow {
  label: string;
  value: string;
  note?: string;
}

interface StatBreakdownModalProps {
  visible: boolean;
  title: string;
  rows: StatBreakdownRow[];
  totalLabel: string;
  totalValue: string;
  onClose: () => void;
}

export function StatBreakdownModal({ visible, title, rows, totalLabel, totalValue, onClose }: StatBreakdownModalProps) {
  const goldColor = useThemeColor({}, 'gold');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} style={styles.cardWrapper}>
          <ThemedView style={[styles.card, { borderColor: goldColor }]}>
            <ThemedText type="subtitle" style={{ color: goldColor }}>
              {title}
            </ThemedText>

            <View style={styles.rows}>
              {rows.map((row, index) => (
                <View key={index} style={styles.row}>
                  <View style={styles.rowLabelColumn}>
                    <ThemedText style={styles.rowLabel}>{row.label}</ThemedText>
                    {row.note ? <ThemedText style={styles.rowNote}>{row.note}</ThemedText> : null}
                  </View>
                  <ThemedText style={styles.rowValue}>{row.value}</ThemedText>
                </View>
              ))}
            </View>

            <View style={[styles.divider, { borderColor: goldColor }]} />

            <View style={styles.row}>
              <ThemedText style={styles.totalLabel}>{totalLabel}</ThemedText>
              <ThemedText style={[styles.totalValue, { color: goldColor }]}>{totalValue}</ThemedText>
            </View>

            <Pressable onPress={onClose} style={[styles.closeButton, { borderColor: goldColor }]}>
              <ThemedText style={{ color: goldColor }}>Fechar</ThemedText>
            </Pressable>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  cardWrapper: {
    width: '100%',
    maxWidth: 340,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    overflow: 'hidden',
  },
  rows: {
    gap: 10,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowLabelColumn: {
    flexShrink: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 14,
  },
  rowNote: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  divider: {
    borderBottomWidth: 1,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: 12,
  },
  closeButton: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 16,
  },
});
