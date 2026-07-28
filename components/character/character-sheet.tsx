import { ScrollView, StyleSheet, View } from 'react-native';

import { AbilityCard } from '@/components/character/ability-card';
import { ClassLevels } from '@/components/character/class-levels';
import { DeathSaves } from '@/components/character/death-saves';
import { EditableStat } from '@/components/character/editable-stat';
import { HexBadge } from '@/components/character/hex-badge';
import { HPTracker } from '@/components/character/hp-tracker';
import { InspirationToggle } from '@/components/character/inspiration-toggle';
import { LevelBadge } from '@/components/character/level-badge';
import { PipRow } from '@/components/character/pip-row';
import { PortraitPlaceholder } from '@/components/character/portrait-placeholder';
import { ProgressBar } from '@/components/character/progress-bar';
import { RestButtons } from '@/components/character/rest-buttons';
import { RoundBadge } from '@/components/character/round-badge';
import { SkillRow } from '@/components/character/skill-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ABILITIES, ABILITIES_BY_KEY, SKILLS } from '@/constants/character';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCharacter } from '@/hooks/use-character';

export function CharacterSheet() {
  const {
    character,
    setName,
    setRace,
    addClass,
    removeClass,
    setClassName,
    setClassLevel,
    toggleInspiration,
    setAbilityScore,
    setAbilityModifier,
    toggleSavingThrowProficiency,
    setSavingThrowModifier,
    toggleSkillProficiency,
    setSkillModifier,
    setProficiencyBonus,
    setPassivePerception,
    setPassiveInsight,
    setArmorClass,
    setInitiative,
    setSpeed,
    setHitPointsField,
    setHitDiceField,
    setExhaustion,
    setDeathSaves,
  } = useCharacter();

  const borderColor = useThemeColor({}, 'icon');

  const characterLevel = character.classes.reduce(
    (total, characterClass) => total + (parseInt(characterClass.level, 10) || 0),
    0
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ClassLevels
            name={character.name}
            onNameChange={setName}
            race={character.race}
            onRaceChange={setRace}
            classes={character.classes}
            onClassNameChange={setClassName}
            onClassLevelChange={setClassLevel}
            onAddClass={addClass}
            onRemoveClass={removeClass}
          />
          <RestButtons />
        </View>
        <View style={styles.headerRight}>
          <LevelBadge level={characterLevel} />
          <InspirationToggle value={character.inspiration} onValueChange={toggleInspiration} />
        </View>
      </View>

      <ThemedView style={[styles.summaryCard, { borderColor }]}>
        <View style={styles.summaryTopRow}>
          <RoundBadge label="CA" value={character.armorClass} onChangeText={setArmorClass} />
          <View style={styles.summaryPortrait}>
            <PortraitPlaceholder />
          </View>
          <View style={styles.hexColumn}>
            <HexBadge label="Iniciativa" value={character.initiative} onChangeText={setInitiative} formatAsModifier />
            <HexBadge label="Desloc." value={character.speed} onChangeText={setSpeed} />
            <HexBadge
              label="Proficiência"
              value={character.proficiencyBonus}
              onChangeText={setProficiencyBonus}
              formatAsModifier
            />
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Pontos de Vida</ThemedText>
          <ProgressBar
            current={character.hitPoints.current}
            max={character.hitPoints.max}
            extra={character.hitPoints.temporary}
          />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Dados de Vida</ThemedText>
          <ProgressBar current={character.hitDice.current} max={character.hitDice.max} />
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionLabel}>Exaustão</ThemedText>
          <PipRow count={6} filled={character.exhaustion} onSetFilled={setExhaustion} />
        </View>

        <View style={[styles.divider, { borderColor }]} />

        <DeathSaves
          successes={character.deathSaves.successes}
          failures={character.deathSaves.failures}
          onSuccessesChange={(value) => setDeathSaves('successes', value)}
          onFailuresChange={(value) => setDeathSaves('failures', value)}
        />
      </ThemedView>

      <View style={styles.section}>
        <HPTracker
          max={character.hitPoints.max}
          onMaxChange={(value) => setHitPointsField('max', value)}
          current={character.hitPoints.current}
          onCurrentChange={(value) => setHitPointsField('current', value)}
          temporary={character.hitPoints.temporary}
          onTemporaryChange={(value) => setHitPointsField('temporary', value)}
        />
        <View style={styles.hitDiceInputs}>
          <EditableStat
            label="Atual"
            value={character.hitDice.current}
            onChangeText={(value) => setHitDiceField('current', value)}
            keyboardType="number-pad"
          />
          <EditableStat
            label="Máximo"
            value={character.hitDice.max}
            onChangeText={(value) => setHitDiceField('max', value)}
            keyboardType="number-pad"
          />
        </View>
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
        <View style={styles.passiveRow}>
          <ThemedText style={styles.passiveLabel}>Percepção Passiva</ThemedText>
          <EditableStat value={character.passivePerception} onChangeText={setPassivePerception} keyboardType="number-pad" />
        </View>
        <View style={styles.passiveRow}>
          <ThemedText style={styles.passiveLabel}>Intuição Passiva</ThemedText>
          <EditableStat value={character.passiveInsight} onChangeText={setPassiveInsight} keyboardType="number-pad" />
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="subtitle">Perícias</ThemedText>
        <View style={styles.skillsList}>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    gap: 10,
    minWidth: 0,
  },
  headerRight: {
    alignItems: 'center',
    gap: 8,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 16,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryPortrait: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hexColumn: {
    gap: 8,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  hitDiceInputs: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  divider: {
    borderBottomWidth: 1,
  },
  abilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  abilityCard: {
    width: '30%',
    minWidth: 0,
  },
  skillsList: {
    alignSelf: 'center',
  },
  passiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  passiveLabel: {
    fontSize: 15,
    flexShrink: 1,
    minWidth: 0,
  },
});
