import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { CollapsibleSection } from '@/components/character/collapsible-section';
import { SpellRow } from '@/components/character/spell-row';
import { SpellSlotPips } from '@/components/character/spell-slot-pips';
import { ThemedText } from '@/components/themed-text';
import { MOCK_MAX_PREPARED_SPELLS, MOCK_SPELL_SAVE_DC, SPELL_LEVEL_SECTIONS, SPELL_SLOT_MAX } from '@/constants/spells';
import { useCharacter } from '@/hooks/use-character';
import { useThemeColor } from '@/hooks/use-theme-color';

export function CharacterSpells() {
  const { character, toggleSpellPrepared, setSpellSlotUsed } = useCharacter();
  const [search, setSearch] = useState('');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');

  const preparedCount = useMemo(() => {
    return SPELL_LEVEL_SECTIONS.filter((section) => section.level >= 1)
      .flatMap((section) => section.items)
      .filter((item) => character.spells[item.id]?.prepared).length;
  }, [character.spells]);

  const normalizedSearch = search.trim().toLowerCase();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderColor }]}>
          <ThemedText style={styles.statLabel}>CD de Magia</ThemedText>
          <ThemedText style={[styles.statValue, { color: textColor }]}>{MOCK_SPELL_SAVE_DC}</ThemedText>
        </View>
        <View style={[styles.statBox, { borderColor }]}>
          <ThemedText style={styles.statLabel}>Preparadas</ThemedText>
          <ThemedText style={[styles.statValue, { color: textColor }]}>
            {preparedCount} ({MOCK_MAX_PREPARED_SPELLS})
          </ThemedText>
        </View>
      </View>

      <View style={[styles.searchRow, { borderColor }]}>
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar magias..."
          placeholderTextColor={borderColor}
        />
        <MaterialCommunityIcons name="filter-variant" size={20} color={borderColor} />
      </View>

      {SPELL_LEVEL_SECTIONS.map((section) => {
        const items = normalizedSearch
          ? section.items.filter((item) => item.name.toLowerCase().includes(normalizedSearch))
          : section.items;

        return (
          <CollapsibleSection
            key={section.key}
            title={section.label}
            right={
              section.level >= 1 ? (
                <SpellSlotPips
                  max={parseInt(SPELL_SLOT_MAX[String(section.level)] ?? '0', 10) || 0}
                  used={character.spellSlotsUsed[String(section.level)] ?? 0}
                  onChange={(value) => setSpellSlotUsed(String(section.level), value)}
                />
              ) : undefined
            }>
            {items.map((item, index) => (
              <SpellRow
                key={item.id}
                name={item.name}
                subtitle={item.castingTime}
                ritual={item.ritual}
                alternate={index % 2 === 1}
                prepared={character.spells[item.id]?.prepared ?? false}
                onTogglePrepared={() => toggleSpellPrepared(item.id)}
              />
            ))}
          </CollapsibleSection>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    opacity: 0.7,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
});
