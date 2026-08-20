import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { PurchaseSummaryLine } from '@/data/wizard/item-purchase';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatCurrencyBreakdown } from '@/utils/currency';

interface PurchaseSummaryModalProps {
  visible: boolean;
  lines: PurchaseSummaryLine[];
  totalCostCp: number;
  remainingCp: number;
  onClose: () => void;
}

// Same overlay/card visual as message-modal.tsx/confirm-modal.tsx, but for
// the item-shop's purchase confirmation, which needs a line list rather
// than a single plain-text message.
export function PurchaseSummaryModal({ visible, lines, totalCostCp, remainingCp, onClose }: PurchaseSummaryModalProps) {
  const goldColor = useThemeColor({}, 'gold');
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} style={styles.cardWrapper}>
          <ThemedView style={[styles.card, { borderColor: goldColor }]}>
            <ThemedText type="subtitle" style={{ color: goldColor }}>
              Resumo da Compra
            </ThemedText>

            <ScrollView style={styles.lineList}>
              {lines.map((line) => (
                <View key={line.key} style={styles.line}>
                  <ThemedText style={styles.lineName} numberOfLines={2}>
                    {line.quantity}x {line.name}
                  </ThemedText>
                  <ThemedText style={styles.lineSubtotal}>{formatCurrencyBreakdown(line.subtotalCp)}</ThemedText>
                </View>
              ))}
            </ScrollView>

            <View style={[styles.totalsBlock, { borderColor: goldColor }]}>
              <View style={styles.totalRow}>
                <ThemedText style={styles.totalLabel}>Subtotal</ThemedText>
                <ThemedText style={[styles.totalValue, { color: goldColor }]}>{formatCurrencyBreakdown(totalCostCp)}</ThemedText>
              </View>
              {remainingCp > 0 ? (
                <View style={styles.totalRow}>
                  <ThemedText style={styles.totalLabel}>Restante</ThemedText>
                  <ThemedText style={[styles.totalValue, { color: goldColor }]}>{formatCurrencyBreakdown(remainingCp)}</ThemedText>
                </View>
              ) : null}
            </View>

            <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: goldColor }]}>
              <ThemedText style={{ color: backgroundColor }}>OK</ThemedText>
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
  lineList: {
    maxHeight: 220,
    marginTop: 8,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingVertical: 4,
  },
  lineName: {
    flex: 1,
    fontSize: 14,
  },
  lineSubtotal: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalsBlock: {
    borderTopWidth: 1,
    marginTop: 8,
    paddingTop: 8,
    gap: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  closeButton: {
    alignSelf: 'flex-end',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 14,
  },
});
