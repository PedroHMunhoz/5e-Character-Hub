import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { CharacterClass } from '@/types/character';

interface ClassLevelsProps {
  name: string;
  race: string;
  classes: CharacterClass[];
}

// Read-only display - name/race/class/level are set during character
// creation (the wizard) or, in the future, a dedicated edit flow (see
// docs/TODO.md's note on editing race/class/background after
// creation). CharacterContext still exposes setName/setRace/setClassName/
// setClassLevel/addClass/removeClass for that future flow; this summary
// screen just no longer calls them.
export function ClassLevels({ name, race, classes }: ClassLevelsProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.name}>{name}</ThemedText>
      <ThemedText style={styles.race}>{race}</ThemedText>
      <View style={styles.classList}>
        {classes.map((characterClass) => (
          <ThemedText key={characterClass.id} style={styles.classRow}>
            {characterClass.name} {characterClass.level}
          </ThemedText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
  },
  race: {
    fontSize: 14,
    opacity: 0.8,
  },
  classList: {
    marginTop: 4,
    gap: 2,
  },
  classRow: {
    fontSize: 13,
  },
});
