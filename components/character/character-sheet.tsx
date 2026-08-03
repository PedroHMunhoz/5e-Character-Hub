import { ScrollView, StyleSheet, View } from 'react-native';

import { ClassLevels } from '@/components/character/class-levels';
import { DeathSaves } from '@/components/character/death-saves';
import { HexModifierBadge } from '@/components/character/hex-modifier-badge';
import { InspirationToggle } from '@/components/character/inspiration-toggle';
import { PassiveScores } from '@/components/character/passive-scores';
import { PipRow } from '@/components/character/pip-row';
import { PortraitPlaceholder } from '@/components/character/portrait-placeholder';
import { StatField } from '@/components/character/stat-field';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCharacter } from '@/hooks/use-character';
import { VitalBar } from '@/components/character/vital-bar';
import { formatSignedModifier, getAbilityModifier, getArmorClass } from '@/utils/ability-modifier';
import { getCharacterLevel, getProficiencyBonus } from '@/utils/proficiency';
import { formatSpeed } from '@/utils/speed';

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
        </View>
        <View style={styles.headerRight}>
          <InspirationToggle value={character.inspiration} onValueChange={toggleInspiration} />
          <HexModifierBadge value={String(characterLevel)} valueColor={goldColor} label="Nível" />
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.combatRow}>
          <View style={styles.combatFields}>
            <VitalBar
              label="Pontos de Vida"
              current={character.hitPoints.current}
              max={character.hitPoints.max}
              gradientColors={['#5c1414', '#8b1e1e']}
            />
            <StatField label="CA" value={String(armorClass)} />
            <StatField label="Iniciativa" value={formatSignedModifier(dexModifier ?? 0)} />
            <StatField label="Deslocamento" value={formatSpeed(character.speed)} />
          </View>
          <View style={styles.portraitWrapper}>
            <PortraitPlaceholder style={styles.portraitImage} />
          </View>
        </View>

        <View style={styles.secondaryRow}>
          <StatField label="PV Temporário" value={character.hitPoints.temporary} style={styles.secondaryField} />
          <StatField
            label="Proficiência"
            value={formatSignedModifier(proficiencyBonus)}
            style={styles.secondaryField}
          />
        </View>

        <VitalBar
          label="Dado de Vida"
          current={character.hitDice.current}
          max={character.hitDice.max}
          gradientColors={['#14401a', '#2e6b34']}
        />

        <PassiveScores proficiencyBonus={proficiencyBonus} />

        <View style={[styles.divider, { borderColor: goldColor }]} />

        <View style={styles.exhaustionRow}>
          <ThemedText type="subtitle" style={styles.sectionLabel}>
            Exaustão
          </ThemedText>
          <PipRow count={6} filled={character.exhaustion} onSetFilled={setExhaustion} />
        </View>

        <DeathSaves
          successes={character.deathSaves.successes}
          failures={character.deathSaves.failures}
          onSuccessesChange={(value) => setDeathSaves('successes', value)}
          onFailuresChange={(value) => setDeathSaves('failures', value)}
        />
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
    alignItems: 'center',
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
    paddingVertical: 12,
    gap: 12,
  },
  combatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  combatFields: {
    flex: 1,
    gap: 6,
  },
  portraitWrapper: {
    width: 128,
    height: 128,
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryField: {
    flex: 1,
  },
  exhaustionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionLabel: {
    fontSize: 16,
  },
  divider: {
    borderBottomWidth: 1,
  },
});
