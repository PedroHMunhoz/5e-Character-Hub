import { Pressable, StyleSheet, View } from 'react-native';

import { EditableStat } from '@/components/character/editable-stat';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

interface HPTrackerProps {
  max: string;
  onMaxChange: (value: string) => void;
  current: string;
  onCurrentChange: (value: string) => void;
  temporary: string;
  onTemporaryChange: (value: string) => void;
}

export function HPTracker({
  max,
  onMaxChange,
  current,
  onCurrentChange,
  temporary,
  onTemporaryChange,
}: HPTrackerProps) {
  const goldColor = useThemeColor({}, 'gold');
  const tintColor = useThemeColor({}, 'tint');

  const currentNum = parseInt(current, 10) || 0;
  const maxNum = parseInt(max, 10);

  function handleHeal() {
    const next = Number.isFinite(maxNum) ? Math.min(currentNum + 1, maxNum) : currentNum + 1;
    onCurrentChange(String(next));
  }

  function handleDamage() {
    const next = Math.max(currentNum - 1, 0);
    onCurrentChange(String(next));
  }

  return (
    <ThemedView style={[styles.card, { borderColor: goldColor }]}>
      <View style={styles.buttonRow}>
        <Pressable onPress={handleHeal} style={[styles.button, { borderColor: tintColor }]}>
          <ThemedText style={[styles.buttonLabel, { color: tintColor }]}>Cura</ThemedText>
        </Pressable>
        <Pressable onPress={handleDamage} style={[styles.button, { borderColor: tintColor }]}>
          <ThemedText style={[styles.buttonLabel, { color: tintColor }]}>Dano</ThemedText>
        </Pressable>
      </View>
      <View style={styles.statsRow}>
        <EditableStat
          label="Atual"
          value={current}
          onChangeText={onCurrentChange}
          keyboardType="number-pad"
          style={styles.item}
          inputStyle={[styles.currentInput, { borderColor: goldColor, color: goldColor }]}
        />
        <ThemedText style={styles.separator}>/</ThemedText>
        <EditableStat
          label="Máximo"
          value={max}
          onChangeText={onMaxChange}
          keyboardType="number-pad"
          style={styles.item}
          inputStyle={[styles.input, { borderColor: goldColor, color: goldColor }]}
        />
        <EditableStat
          label="Temp."
          value={temporary}
          onChangeText={onTemporaryChange}
          keyboardType="number-pad"
          style={styles.item}
          inputStyle={[styles.input, { borderColor: goldColor, color: goldColor }]}
        />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
  },
  item: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    width: '100%',
  },
  currentInput: {
    width: '100%',
    fontSize: 26,
    fontWeight: '700',
    height: 48,
  },
  separator: {
    fontSize: 24,
    opacity: 0.5,
    paddingBottom: 8,
  },
});
