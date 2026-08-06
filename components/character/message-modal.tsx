import { Modal, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface MessageModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
}

export function MessageModal({ visible, title, message, onClose }: MessageModalProps) {
  const goldColor = useThemeColor({}, 'gold');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable onPress={() => {}} style={styles.cardWrapper}>
          <ThemedView style={[styles.card, { borderColor: goldColor }]}>
            <ThemedText type="subtitle" style={{ color: goldColor }}>
              {title}
            </ThemedText>
            <ThemedText style={styles.message}>{message}</ThemedText>
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
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  closeButton: {
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginTop: 12,
  },
});
