import { StyleSheet, View } from 'react-native';

import { PipRow } from '@/components/character/pip-row';
import { ThemedText } from '@/components/themed-text';

interface DeathSavesProps {
  successes: number;
  failures: number;
  onSuccessesChange: (value: number) => void;
  onFailuresChange: (value: number) => void;
}

export function DeathSaves({ successes, failures, onSuccessesChange, onFailuresChange }: DeathSavesProps) {
  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.title}>
        Resistência à Morte
      </ThemedText>
      <View style={styles.row}>
        <ThemedText style={styles.label}>Sucesso</ThemedText>
        <PipRow count={3} filled={successes} onSetFilled={onSuccessesChange} color="#2e9e44" icon="check-bold" />
      </View>
      <View style={styles.row}>
        <ThemedText style={styles.label}>Falha</ThemedText>
        <PipRow count={3} filled={failures} onSetFilled={onFailuresChange} color="#c0392b" icon="skull" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  title: {
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    fontSize: 13,
    width: 64,
  },
});
