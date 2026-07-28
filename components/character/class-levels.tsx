import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { CharacterClass } from '@/types/character';

interface ClassLevelsProps {
  name: string;
  onNameChange: (value: string) => void;
  race: string;
  onRaceChange: (value: string) => void;
  classes: CharacterClass[];
  onClassNameChange: (id: string, value: string) => void;
  onClassLevelChange: (id: string, value: string) => void;
  onAddClass: () => void;
  onRemoveClass: (id: string) => void;
}

export function ClassLevels({
  name,
  onNameChange,
  race,
  onRaceChange,
  classes,
  onClassNameChange,
  onClassLevelChange,
  onAddClass,
  onRemoveClass,
}: ClassLevelsProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.nameInput, { color: textColor }]}
        value={name}
        onChangeText={onNameChange}
        placeholder="Nome do Personagem"
        placeholderTextColor={borderColor}
      />
      <TextInput
        style={[styles.raceInput, { color: textColor }]}
        value={race}
        onChangeText={onRaceChange}
        placeholder="Raça"
        placeholderTextColor={borderColor}
      />
      <View style={styles.classList}>
        {classes.map((characterClass) => (
          <View key={characterClass.id} style={styles.classRow}>
            <TextInput
              style={[styles.classNameInput, { color: textColor, borderColor }]}
              value={characterClass.name}
              onChangeText={(value) => onClassNameChange(characterClass.id, value)}
              placeholder="Classe"
              placeholderTextColor={borderColor}
            />
            <TextInput
              style={[styles.classLevelInput, { color: textColor, borderColor }]}
              value={characterClass.level}
              onChangeText={(value) => onClassLevelChange(characterClass.id, value)}
              placeholder="Nível"
              placeholderTextColor={borderColor}
              keyboardType="number-pad"
            />
            {classes.length > 1 ? (
              <Pressable onPress={() => onRemoveClass(characterClass.id)} hitSlop={8}>
                <ThemedText style={[styles.removeButton, { color: tintColor }]}>×</ThemedText>
              </Pressable>
            ) : null}
          </View>
        ))}
        <Pressable onPress={onAddClass} hitSlop={8}>
          <ThemedText style={[styles.addButton, { color: tintColor }]}>+ Classe</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '700',
    padding: 0,
  },
  raceInput: {
    fontSize: 14,
    opacity: 0.8,
    padding: 0,
  },
  classList: {
    marginTop: 4,
    gap: 4,
  },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classNameInput: {
    flex: 1,
    fontSize: 13,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  classLevelInput: {
    width: 48,
    fontSize: 13,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  removeButton: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    fontSize: 13,
    fontWeight: '600',
  },
});
