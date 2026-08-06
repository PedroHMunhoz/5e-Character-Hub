import { Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ConfirmModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Sim',
  cancelLabel = 'Não',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const goldColor = useThemeColor({}, 'gold');
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable onPress={() => {}} style={styles.cardWrapper}>
          <ThemedView style={[styles.card, { borderColor: goldColor }]}>
            <ThemedText type="subtitle" style={{ color: goldColor }}>
              {title}
            </ThemedText>
            <ThemedText style={styles.message}>{message}</ThemedText>
            <ThemedView style={styles.buttonRow}>
              <Pressable onPress={onCancel} style={[styles.button, { borderColor: goldColor }]}>
                <ThemedText style={{ color: goldColor }}>{cancelLabel}</ThemedText>
              </Pressable>
              <Pressable
                onPress={onConfirm}
                style={[styles.button, styles.confirmButton, { backgroundColor: goldColor }]}>
                <ThemedText style={{ color: backgroundColor }}>{confirmLabel}</ThemedText>
              </Pressable>
            </ThemedView>
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
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  button: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  confirmButton: {
    borderWidth: 0,
  },
});
