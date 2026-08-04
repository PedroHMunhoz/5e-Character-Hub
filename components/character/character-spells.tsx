import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { CollapsibleSection } from '@/components/character/collapsible-section';
import { SpellRow } from '@/components/character/spell-row';
import { SpellSlotPips } from '@/components/character/spell-slot-pips';
import { ThemedText } from '@/components/themed-text';
import {
  MOCK_MAX_PREPARED_SPELLS,
  MOCK_SPELL_ATTACK_BONUS,
  MOCK_SPELL_SAVE_DC,
  SPELL_LEVEL_LABELS,
  SPELL_LOADING_MESSAGES,
  SPELL_SCHOOL_LABELS,
  SPELL_SLOT_MAX,
} from '@/constants/spells';
import { getCuratedSpellbook } from '@/data/queries/spells';
import { useCharacter } from '@/hooks/use-character';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Spell } from '@/types/reference';

export function CharacterSpells() {
  const db = useSQLiteContext();
  const { character, toggleSpellPrepared, setSpellSlotUsed } = useCharacter();
  const [search, setSearch] = useState('');
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage] = useState(
    () => SPELL_LOADING_MESSAGES[Math.floor(Math.random() * SPELL_LOADING_MESSAGES.length)]
  );
  const goldColor = useThemeColor({}, 'gold');
  const textColor = useThemeColor({}, 'text');

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const start = Date.now();

    getCuratedSpellbook(db).then((data) => {
      if (cancelled) return;
      // Empty spellbook: nothing to read, so skip the artificial delay. When
      // there are spells, keep the indicator up for at least 3s (long enough
      // to actually read the flavor message) unless loading itself took
      // longer, in which case just show it until the data is ready.
      const minDisplayMs = data.length > 0 ? 3000 : 0;
      const remaining = Math.max(0, minDisplayMs - (Date.now() - start));

      timeoutId = setTimeout(() => {
        if (cancelled) return;
        setSpells(data);
        setLoading(false);
      }, remaining);
    });

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [db]);

  const sections = useMemo(
    () =>
      SPELL_LEVEL_LABELS.map(({ key, label, level }) => ({
        key,
        label,
        level,
        items: spells.filter((spell) => spell.level === level),
      })),
    [spells]
  );

  const preparedCount = useMemo(() => {
    return spells.filter((spell) => spell.level >= 1 && character.spells[String(spell.id)]?.prepared).length;
  }, [character.spells, spells]);

  const normalizedSearch = search.trim().toLowerCase();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={goldColor} />
        <ThemedText style={[styles.loadingMessage, { color: goldColor }]}>{loadingMessage}</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { borderColor: goldColor }]}>
          <ThemedText style={[styles.statLabel, { color: goldColor }]}>CD de Magia</ThemedText>
          <ThemedText style={[styles.statValue, { color: textColor }]}>{MOCK_SPELL_SAVE_DC}</ThemedText>
        </View>
        <View style={[styles.statBox, { borderColor: goldColor }]}>
          <ThemedText style={[styles.statLabel, { color: goldColor }]}>Bônus de Ataque</ThemedText>
          <ThemedText style={[styles.statValue, { color: textColor }]}>{MOCK_SPELL_ATTACK_BONUS}</ThemedText>
        </View>
        <View style={[styles.statBox, { borderColor: goldColor }]}>
          <ThemedText style={[styles.statLabel, { color: goldColor }]}>Preparadas</ThemedText>
          <ThemedText style={[styles.statValue, { color: textColor }]}>
            {preparedCount}/{MOCK_MAX_PREPARED_SPELLS}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.searchRow, { borderColor: goldColor }]}>
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar magias..."
          placeholderTextColor={goldColor}
        />
      </View>

      {sections.map((section) => {
        const items = normalizedSearch
          ? section.items.filter((spell) => spell.name.toLowerCase().includes(normalizedSearch))
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
            <View style={styles.cardList}>
              {items.map((spell) => (
                <SpellRow
                  key={spell.id}
                  name={spell.name}
                  school={SPELL_SCHOOL_LABELS[spell.school] ?? spell.school}
                  ritual={spell.ritual}
                  prepared={section.level >= 1 ? (character.spells[String(spell.id)]?.prepared ?? false) : undefined}
                  onTogglePrepared={section.level >= 1 ? () => toggleSpellPrepared(String(spell.id)) : undefined}
                />
              ))}
            </View>
          </CollapsibleSection>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingMessage: {
    fontSize: 15,
    fontStyle: 'italic',
  },
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
    fontSize: 9,
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
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  cardList: {
    gap: 8,
  },
});
