import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { BiographyTextField } from '@/components/character/biography-text-field';
import { ThemedText } from '@/components/themed-text';
import { WizardStepHeader } from '@/components/wizard/wizard-step-header';
import { BIOGRAPHY_SHORT_FIELDS } from '@/constants/biography';
import { useCharacterDb } from '@/context/character-db-context';
import { useWizardDraft } from '@/context/wizard-context';
import { createCharacter } from '@/data/queries/player-characters';
import { assembleCharacter } from '@/data/wizard/assemble-character';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Biography } from '@/types/character';

// Alignment (Tendência) is explicitly out of scope here - filled in later
// via the existing Biography tab, alongside Ideais/Vínculos/Defeitos.
const APPEARANCE_FIELDS = BIOGRAPHY_SHORT_FIELDS.filter((field) => field.key !== 'alignment');

export default function WizardDetailsStep() {
  const referenceDb = useSQLiteContext();
  const charactersDb = useCharacterDb();
  const router = useRouter();
  const { draft } = useWizardDraft();
  const goldColor = useThemeColor({}, 'gold');

  const [name, setName] = useState(draft.name);
  const [appearance, setAppearance] = useState<Partial<Biography>>({});
  const [creating, setCreating] = useState(false);

  const canCreate = name.trim().length > 0 && !creating;

  async function handleCreate() {
    if (!canCreate) return;
    setCreating(true);
    try {
      const character = await assembleCharacter(referenceDb, { draft, name: name.trim(), appearance });
      await createCharacter(charactersDb, character);
      router.replace({ pathname: '/sheet/[characterId]', params: { characterId: character.id } });
    } finally {
      setCreating(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <WizardStepHeader step={7} title="Detalhes" subtitle="Nome e aparência do personagem." />

        <BiographyTextField label="Nome" value={name} onChangeText={setName} />

        <View style={styles.appearanceGrid}>
          {APPEARANCE_FIELDS.map((field) => (
            <BiographyTextField
              key={field.key}
              label={field.label}
              value={appearance[field.key] ?? ''}
              onChangeText={(value) => setAppearance((prev) => ({ ...prev, [field.key]: value }))}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderColor: goldColor }]}>
        <Pressable
          disabled={!canCreate}
          onPress={handleCreate}
          style={[styles.nextButton, { borderColor: goldColor, opacity: canCreate ? 1 : 0.4 }]}
        >
          <ThemedText style={[styles.nextButtonText, { color: goldColor }]}>
            {creating ? 'Criando...' : 'Criar Personagem'}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  appearanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  nextButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
