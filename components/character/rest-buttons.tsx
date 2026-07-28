import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export function RestButtons() {
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View style={styles.row}>
      <Pressable style={[styles.button, { borderColor: tintColor }]}>
        <ThemedText style={[styles.label, { color: tintColor }]}>Descanso Curto</ThemedText>
      </Pressable>
      <Pressable style={[styles.button, { borderColor: tintColor }]}>
        <ThemedText style={[styles.label, { color: tintColor }]}>Descanso Longo</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});
