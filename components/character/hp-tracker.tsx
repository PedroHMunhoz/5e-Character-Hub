import { StyleSheet } from 'react-native';

import { EditableStat } from '@/components/character/editable-stat';
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
  const borderColor = useThemeColor({}, 'icon');

  return (
    <ThemedView style={[styles.card, { borderColor }]}>
      <EditableStat
        label="Máximo"
        value={max}
        onChangeText={onMaxChange}
        keyboardType="number-pad"
        style={styles.item}
        inputStyle={styles.input}
      />
      <EditableStat
        label="Atual"
        value={current}
        onChangeText={onCurrentChange}
        keyboardType="number-pad"
        style={styles.item}
        inputStyle={styles.input}
      />
      <EditableStat
        label="Temp."
        value={temporary}
        onChangeText={onTemporaryChange}
        keyboardType="number-pad"
        style={styles.item}
        inputStyle={styles.input}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  item: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    width: '100%',
  },
});
