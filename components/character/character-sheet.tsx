import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ClassLevels } from '@/components/character/class-levels';
import { DeathSaves } from '@/components/character/death-saves';
import { HexModifierBadge } from '@/components/character/hex-modifier-badge';
import { InspirationToggle } from '@/components/character/inspiration-toggle';
import { ManageHpModal, type HpOutcome } from '@/components/character/manage-hp-modal';
import { MessageModal } from '@/components/character/message-modal';
import { PassiveScores } from '@/components/character/passive-scores';
import { PipRow } from '@/components/character/pip-row';
import { PortraitPlaceholder } from '@/components/character/portrait-placeholder';
import { StatBreakdownModal } from '@/components/character/stat-breakdown-modal';
import { StatField } from '@/components/character/stat-field';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useCharacter } from '@/hooks/use-character';
import { useCharacterClassInfo } from '@/hooks/use-character-class-info';
import { useEquippedArmor } from '@/hooks/use-equipped-armor';
import { VitalBar } from '@/components/character/vital-bar';
import { formatAbilityTotal, formatSignedModifier, getAbilityModifier } from '@/utils/ability-modifier';
import { getArmorClassBreakdown, type UnarmoredDefenseRule } from '@/utils/armor-class';
import { getCharacterLevel, getProficiencyBonus } from '@/utils/proficiency';
import { formatSpeed, getMonkUnarmoredMovementBonusMeters } from '@/utils/speed';

export function CharacterSheet() {
  const { character, toggleInspiration, setExhaustion, setDeathSaves, setHitPointsField } = useCharacter();

  const goldColor = useThemeColor({}, 'gold');
  const [openStat, setOpenStat] = useState<'ac' | 'initiative' | null>(null);
  const [hpModalVisible, setHpModalVisible] = useState(false);
  const [tempHpModalVisible, setTempHpModalVisible] = useState(false);
  const [hpOutcome, setHpOutcome] = useState<HpOutcome | null>(null);

  const characterLevel = getCharacterLevel(character.classes);
  const proficiencyBonus = getProficiencyBonus(characterLevel);
  const dexTotal = formatAbilityTotal(character.abilities.dex);
  const dexModifier = getAbilityModifier(dexTotal);
  const equippedArmor = useEquippedArmor();
  const { englishName: classEnglishName, subclassShortName } = useCharacterClassInfo();

  const unarmoredDefenseRule: UnarmoredDefenseRule | undefined =
    classEnglishName === 'Barbarian'
      ? {
          label: 'Defesa sem Armadura',
          baseAC: 10,
          secondaryAbilityScore: formatAbilityTotal(character.abilities.con),
          requiresNoShield: false,
        }
      : classEnglishName === 'Monk'
        ? {
            label: 'Defesa sem Armadura',
            baseAC: 10,
            secondaryAbilityScore: formatAbilityTotal(character.abilities.wis),
            requiresNoShield: true,
          }
        : subclassShortName === 'Draconic'
          ? { label: 'Resiliência Dracônica', baseAC: 13, requiresNoShield: false }
          : undefined;

  const armorClassBreakdown = getArmorClassBreakdown(
    dexTotal,
    equippedArmor,
    character.fightingStyle ?? null,
    unarmoredDefenseRule
  );

  const unarmoredMovementBonus =
    classEnglishName === 'Monk' && equippedArmor.length === 0
      ? getMonkUnarmoredMovementBonusMeters(characterLevel)
      : 0;
  const displaySpeed = String(Number(character.speed) + unarmoredMovementBonus);

  const acRows = [
    { label: 'CA Base', value: String(armorClassBreakdown.base) },
    {
      label: 'Modificador de Destreza',
      value: formatSignedModifier(armorClassBreakdown.effectiveDexModifier),
      note: armorClassBreakdown.dexCapNote,
    },
    ...armorClassBreakdown.items.map((item) => ({ label: item.name, value: formatSignedModifier(item.bonus) })),
  ];

  // Alert (PHB p.165): "+5 bonus to initiative".
  const alertBonus = character.feats?.some((f) => f.englishName === 'Alert') ? 5 : 0;
  const initiativeTotal = (dexModifier ?? 0) + alertBonus;
  const initiativeRows = [
    { label: 'Modificador de Destreza', value: formatSignedModifier(dexModifier ?? 0) },
    ...(alertBonus ? [{ label: 'Talento: Alerta', value: formatSignedModifier(alertBonus) }] : []),
  ];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <ClassLevels name={character.name} race={character.race} classes={character.classes} />
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
              onPress={() => setHpModalVisible(true)}
            />
            <StatField label="CA" value={String(armorClassBreakdown.total)} onPress={() => setOpenStat('ac')} />
            <StatField
              label="Iniciativa"
              value={formatSignedModifier(initiativeTotal)}
              onPress={() => setOpenStat('initiative')}
            />
            <StatField label="Deslocamento" value={formatSpeed(displaySpeed)} />
          </View>
          <View style={styles.portraitWrapper}>
            <PortraitPlaceholder style={styles.portraitImage} />
          </View>
        </View>

        <View style={styles.secondaryRow}>
          <StatField
            label="PV Temporário"
            value={character.hitPoints.temporary}
            style={styles.secondaryField}
            onPress={() => setTempHpModalVisible(true)}
          />
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

      <StatBreakdownModal
        visible={openStat === 'ac'}
        title="Classe de Armadura"
        rows={acRows}
        totalLabel="Total"
        totalValue={String(armorClassBreakdown.total)}
        onClose={() => setOpenStat(null)}
      />

      <StatBreakdownModal
        visible={openStat === 'initiative'}
        title="Iniciativa"
        rows={initiativeRows}
        totalLabel="Total"
        totalValue={formatSignedModifier(initiativeTotal)}
        onClose={() => setOpenStat(null)}
      />

      <ManageHpModal
        visible={hpModalVisible}
        current={character.hitPoints.current}
        temporary={character.hitPoints.temporary}
        max={character.hitPoints.max}
        onClose={() => setHpModalVisible(false)}
        onApply={(result, outcome) => {
          setHitPointsField('current', result.current);
          setHitPointsField('temporary', result.temporary);
          setHpModalVisible(false);
          if (outcome) setHpOutcome(outcome);
        }}
      />

      <ManageHpModal
        visible={tempHpModalVisible}
        variant="temp-only"
        current={character.hitPoints.current}
        temporary={character.hitPoints.temporary}
        max={character.hitPoints.max}
        onClose={() => setTempHpModalVisible(false)}
        onApply={(result) => {
          setHitPointsField('temporary', result.temporary);
          setTempHpModalVisible(false);
        }}
      />

      <MessageModal
        visible={hpOutcome !== null}
        title={hpOutcome?.title}
        message={hpOutcome?.message}
        onClose={() => setHpOutcome(null)}
      />
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
