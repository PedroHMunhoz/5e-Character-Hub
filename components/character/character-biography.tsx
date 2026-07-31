import { ScrollView, StyleSheet, View } from 'react-native';

import { BiographyTextField } from '@/components/character/biography-text-field';
import { BiographyTextarea } from '@/components/character/biography-textarea';
import { BIOGRAPHY_SHORT_FIELDS, BIOGRAPHY_TEXTAREA_FIELDS } from '@/constants/biography';
import { useCharacter } from '@/hooks/use-character';

export function CharacterBiography() {
  const { character, setBiographyField } = useCharacter();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.shortFieldsGrid}>
        {BIOGRAPHY_SHORT_FIELDS.map((field) => (
          <BiographyTextField
            key={field.key}
            label={field.label}
            value={character.biography[field.key]}
            onChangeText={(value) => setBiographyField(field.key, value)}
          />
        ))}
      </View>

      <View style={styles.textareaGrid}>
        {BIOGRAPHY_TEXTAREA_FIELDS.map((field) => (
          <BiographyTextarea
            key={field.key}
            label={field.label}
            value={character.biography[field.key]}
            onChangeText={(value) => setBiographyField(field.key, value)}
            minHeight={100}
            style={styles.textareaItem}
          />
        ))}
      </View>

      <BiographyTextarea
        label="Biografia"
        value={character.biography.notes}
        onChangeText={(value) => setBiographyField('notes', value)}
        minHeight={180}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 20,
  },
  shortFieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  textareaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  textareaItem: {
    flexGrow: 1,
    flexBasis: '48%',
    minWidth: 260,
  },
});
