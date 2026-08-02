import { ScrollView, StyleSheet, View } from 'react-native';

import { ClassLevels } from '@/components/character/class-levels';
import { DeathSaves } from '@/components/character/death-saves';
import { EditableStat } from '@/components/character/editable-stat';
import { HexBadge } from '@/components/character/hex-badge';
import { HexModifierBadge } from '@/components/character/hex-modifier-badge';
import { HPTracker } from '@/components/character/hp-tracker';
import { InspirationToggle } from '@/components/character/inspiration-toggle';
import { PassiveScores } from '@/components/character/passive-scores';
import { PipRow } from '@/components/character/pip-row';
import { PortraitPlaceholder } from '@/components/character/portrait-placeholder';
import { RestButtons } from '@/components/character/rest-buttons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCharacter } from '@/hooks/use-character';
import { VitalBar } from '@/components/character/vital-bar';
import { formatSignedModifier, getAbilityModifier, getArmorClass } from '@/utils/ability-modifier';
import { getCharacterLevel, getProficiencyBonus } from '@/utils/proficiency';

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
    setSpeed,
    setHitPointsField,
    setHitDiceField,
    setExhaustion,
    setDeathSaves,
  } = useCharacter();

  const goldColor = useThemeColor({}, 'gold');

  const characterLevel = getCharacterLevel(character.classes);
  const proficiencyBonus = getProficiencyBonus(characterLevel);
  const dexModifier = getAbilityModifier(character.abilities.dex.score);
  const armorClass = getArmorClass(character.abilities.dex.score);

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
          <HexModifierBadge value={String(characterLevel)} valueColor={goldColor} />
          <InspirationToggle value={character.inspiration} onValueChange={toggleInspiration} />
        </View>
      </View>

      <ThemedView style={[styles.summaryCard, { borderColor: goldColor }]}>
        <View style={styles.summaryTopRow}>
          <HexBadge label="CA" value={String(armorClass)} editable={false} />
          <View style={styles.summaryPortrait}>
            <PortraitPlaceholder />
          </View>
          <View style={styles.hexColumn}>
            <HexBadge label="Iniciativa" value={formatSignedModifier(dexModifier ?? 0)} editable={false} />
            <HexBadge label="Desloc." value={character.speed} onChangeText={setSpeed} />
            <HexBadge label="Proficiência" value={formatSignedModifier(proficiencyBonus)} editable={false} />
          </View>
        </View>

        <VitalBar
          label="Pontos de Vida"
          current={character.hitPoints.current}
          max={character.hitPoints.max}
          extra={character.hitPoints.temporary}
          gradientColors={['#5c1414', '#8b1e1e']}
        />

        <VitalBar
          label="Dados de Vida"
          current={character.hitDice.current}
          max={character.hitDice.max}
          gradientColors={['#14401a', '#2e6b34']}
        />

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionLabel}>
            Exaustão
          </ThemedText>
          <PipRow count={6} filled={character.exhaustion} onSetFilled={setExhaustion} />
        </View>

        <View style={[styles.divider, { borderColor: goldColor }]} />

        <DeathSaves
          successes={character.deathSaves.successes}
          failures={character.deathSaves.failures}
          onSuccessesChange={(value) => setDeathSaves('successes', value)}
          onFailuresChange={(value) => setDeathSaves('failures', value)}
        />
      </ThemedView>

      <PassiveScores proficiencyBonus={proficiencyBonus} />

      <View style={styles.section}>
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
        <View style={styles.hitDiceInputs}>
          <EditableStat
            label="Atual"
            value={character.hitDice.current}
            onChangeText={(value) => setHitDiceField('current', value)}
            keyboardType="number-pad"
            inputStyle={{ borderColor: goldColor, color: goldColor }}
          />
          <EditableStat
            label="Máximo"
            value={character.hitDice.max}
            onChangeText={(value) => setHitDiceField('max', value)}
            keyboardType="number-pad"
            inputStyle={{ borderColor: goldColor, color: goldColor }}
          />
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
    fontSize: 16,
  },
  hitDiceInputs: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  divider: {
    borderBottomWidth: 1,
  },
});
