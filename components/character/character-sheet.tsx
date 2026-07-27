import { ScrollView, StyleSheet, View } from 'react-native';

import { AbilityCard } from '@/components/character/ability-card';
import { EditableModifier } from '@/components/character/editable-modifier';
import { EditableStat } from '@/components/character/editable-stat';
import { HPTracker } from '@/components/character/hp-tracker';
import { SkillRow } from '@/components/character/skill-row';
import { ThemedText } from '@/components/themed-text';
import { ABILITIES, ABILITIES_BY_KEY, SKILLS } from '@/constants/character';
import { useCharacter } from '@/hooks/use-character';

export function CharacterSheet() {
  const {
    character,
    setAbilityScore,
    setAbilityModifier,
    toggleSavingThrowProficiency,
    setSavingThrowModifier,
    toggleSkillProficiency,
    setSkillModifier,
    setProficiencyBonus,
    setPassivePerception,
    setArmorClass,
    setInitiative,
    setSpeed,
    setHitPointsField,
  } = useCharacter();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <ThemedText type="subtitle">Combate</ThemedText>
        <View style={styles.combatRow}>
          <EditableStat
            label="CA"
            value={character.armorClass}
            onChangeText={setArmorClass}
            keyboardType="number-pad"
            style={styles.combatItem}
            inputStyle={styles.combatInput}
          />
          <EditableStat
            label="Iniciativa"
            value={character.initiative}
            onChangeText={setInitiative}
            style={styles.combatItem}
            inputStyle={styles.combatInput}
          />
          <EditableStat
            label="Desloc."
            value={character.speed}
            onChangeText={setSpeed}
            style={styles.combatItem}
            inputStyle={styles.combatInput}
          />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Pontos de Vida</ThemedText>
        <HPTracker
          max={character.hitPoints.max}
          onMaxChange={(value) => setHitPointsField('max', value)}
          current={character.hitPoints.current}
          onCurrentChange={(value) => setHitPointsField('current', value)}
          temporary={character.hitPoints.temporary}
          onTemporaryChange={(value) => setHitPointsField('temporary', value)}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Bônus de Proficiência</ThemedText>
        <EditableModifier value={character.proficiencyBonus} onChangeText={setProficiencyBonus} />
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Atributos</ThemedText>
        <View style={styles.abilityGrid}>
          {ABILITIES.map((ability) => (
            <AbilityCard
              key={ability.key}
              style={styles.abilityCard}
              label={ability.label}
              score={character.abilities[ability.key].score}
              onScoreChange={(value) => setAbilityScore(ability.key, value)}
              modifier={character.abilities[ability.key].modifier}
              onModifierChange={(value) => setAbilityModifier(ability.key, value)}
              savingThrowProficient={character.savingThrows[ability.key].proficient}
              onToggleSavingThrowProficiency={() => toggleSavingThrowProficiency(ability.key)}
              savingThrowModifier={character.savingThrows[ability.key].modifier}
              onSavingThrowModifierChange={(value) => setSavingThrowModifier(ability.key, value)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Perícias</ThemedText>
        {SKILLS.map((skill) => (
          <SkillRow
            key={skill.key}
            label={`${skill.label} (${ABILITIES_BY_KEY[skill.ability].abbr})`}
            proficient={character.skills[skill.key].proficient}
            onToggleProficiency={() => toggleSkillProficiency(skill.key)}
            modifier={character.skills[skill.key].modifier}
            onModifierChange={(value) => setSkillModifier(skill.key, value)}
          />
        ))}
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Sabedoria Passiva (Percepção)</ThemedText>
        <EditableStat value={character.passivePerception} onChangeText={setPassivePerception} keyboardType="number-pad" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  combatRow: {
    flexDirection: 'row',
    gap: 12,
  },
  combatItem: {
    flex: 1,
    minWidth: 0,
  },
  combatInput: {
    width: '100%',
  },
  abilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  abilityCard: {
    width: '47%',
    minWidth: 0,
  },
});
