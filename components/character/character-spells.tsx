import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { CollapsibleSection } from '@/components/character/collapsible-section';
import { MessageModal } from '@/components/character/message-modal';
import { SpellRow } from '@/components/character/spell-row';
import { SpellSlotPips } from '@/components/character/spell-slot-pips';
import { ThemedText } from '@/components/themed-text';
import { SPELLCASTING_RULES } from '@/constants/spellcasting';
import {
  SPELL_LEVEL_LABELS,
  SPELL_LOADING_MESSAGES,
  SPELL_SCHOOL_LABELS,
} from '@/constants/spells';
import { getClassById, getClassEnglishName, getSubclassAdditionalSpellsByLevel } from '@/data/queries/classes';
import { getSpellsByIds, getSpellsByNames, getSpellsForClass } from '@/data/queries/spells';
import { useCharacter } from '@/hooks/use-character';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { AbilityKey } from '@/types/character';
import type { CharacterClassDefinition, Spell } from '@/types/reference';
import { formatSignedModifier, getAbilityModifierFromTotal } from '@/utils/ability-modifier';
import { getCharacterLevel, getProficiencyBonus } from '@/utils/proficiency';
import { sortByLocalizedName } from '@/utils/sort-by-name';
import { getPreparedSpellCount, getSpellAttackBonus, getSpellSaveDC, getSpellSlots } from '@/utils/spellcasting';

export function CharacterSpells() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { character, toggleSpellPrepared, setSpellSlotUsed } = useCharacter();
  const [search, setSearch] = useState('');
  const [spells, setSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessage] = useState(
    () => SPELL_LOADING_MESSAGES[Math.floor(Math.random() * SPELL_LOADING_MESSAGES.length)]
  );
  const [classDef, setClassDef] = useState<CharacterClassDefinition | null>(null);
  const [englishName, setEnglishName] = useState<string | null>(null);
  const [domainSpellIds, setDomainSpellIds] = useState<Set<number>>(new Set());
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const goldColor = useThemeColor({}, 'gold');
  const textColor = useThemeColor({}, 'text');

  const spellIds = useMemo(() => Object.keys(character.spells).map(Number), [character.spells]);
  const classId = character.classes[0]?.classId;
  const subclassId = character.classes[0]?.subclassId ?? null;
  const characterLevel = getCharacterLevel(character.classes);

  useEffect(() => {
    let cancelled = false;
    if (classId == null) {
      setClassDef(null);
      setEnglishName(null);
      return;
    }
    Promise.all([getClassById(db, classId), getClassEnglishName(db, classId)]).then(([def, name]) => {
      if (cancelled) return;
      setClassDef(def);
      setEnglishName(name);
    });
    return () => {
      cancelled = true;
    };
  }, [db, classId]);

  const rule = englishName ? SPELLCASTING_RULES[englishName] : undefined;
  // Cleric/Druid-style classes choose which spells to prepare from their
  // ENTIRE class list each day, rather than knowing a fixed repertoire -
  // see docs/TODO.md.
  const isFullListCaster = rule?.preparedFromFullList ?? false;

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const start = Date.now();

    // Full-list casters (Cleric/Druid) see their class's whole spell list
    // rather than character.spells - but a racial/off-list spell recorded in
    // character.spells (e.g. a Tiefling Druid's granted Thaumaturgy, not on
    // Druid's own list) still needs to be merged in, or it'd never render.
    // Same deal for a domain/circle spell that isn't already on the class's
    // own list (e.g. Knowledge Domain's Identify, not a Cleric spell) -
    // getSubclassAdditionalSpellsByLevel resolves it into domainSpellIds and
    // the render loop is ready to flag it as always-prepared, but it still
    // has to be merged into `spells` here first or it's never fetched at all.
    const extraSourceIds = [...new Set([...spellIds, ...domainSpellIds])];
    const spellsPromise =
      isFullListCaster && englishName
        ? getSpellsForClass(db, englishName).then(async (classSpells) => {
            const classSpellIds = new Set(classSpells.map((spell) => spell.id));
            const extraIds = extraSourceIds.filter((id) => !classSpellIds.has(id));
            if (extraIds.length === 0) return classSpells;
            const extraSpells = await getSpellsByIds(db, extraIds);
            return [...classSpells, ...extraSpells];
          })
        : getSpellsByIds(db, extraSourceIds);

    spellsPromise.then((data) => {
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
  }, [db, spellIds, isFullListCaster, englishName, domainSpellIds]);

  // Always-prepared bonus spells granted by the character's subclass (e.g.
  // Cleric domain spells) - don't count against the prepared limit and
  // can't be un-prepared. Only populated for the unambiguous case (see
  // getSubclassAdditionalSpellsByLevel).
  useEffect(() => {
    let cancelled = false;
    if (subclassId == null) {
      setDomainSpellIds(new Set());
      return;
    }
    getSubclassAdditionalSpellsByLevel(db, subclassId).then(async (byLevel) => {
      if (cancelled) return;
      if (!byLevel) {
        setDomainSpellIds(new Set());
        return;
      }
      const names = Array.from(
        new Set(
          Object.entries(byLevel)
            .filter(([level]) => Number(level) <= characterLevel)
            .flatMap(([, spellNames]) => spellNames)
        )
      );
      const resolved = await getSpellsByNames(db, names);
      if (cancelled) return;
      setDomainSpellIds(new Set(resolved.map((spell) => spell.id)));
    });
    return () => {
      cancelled = true;
    };
  }, [db, subclassId, characterLevel]);

  const proficiencyBonus = getProficiencyBonus(characterLevel) ?? 0;
  const casterProgression = classDef?.casterProgression ?? null;
  const spellSlots = getSpellSlots(casterProgression, characterLevel);
  const spellcastingAbility = (classDef?.spellcastingAbility as AbilityKey | null) ?? null;
  const abilityModifier = spellcastingAbility
    ? getAbilityModifierFromTotal(character.abilities[spellcastingAbility])
    : null;
  const showRealStats = spellcastingAbility != null && abilityModifier != null && rule != null;

  const spellSaveDC = showRealStats ? getSpellSaveDC(proficiencyBonus, abilityModifier!) : null;
  const spellAttackBonus = showRealStats ? getSpellAttackBonus(proficiencyBonus, abilityModifier!) : null;
  const maxPrepared = !showRealStats
    ? 0
    : rule!.maxPreparedFormula
      ? getPreparedSpellCount(abilityModifier!, characterLevel)
      : (rule!.spellsKnownFixed ?? 0);

  // Full-list casters can only PREPARE spells of a level they actually have
  // slots for, but the full class list is still shown (see the render loop
  // below) so the player can see what's coming as they level up.
  const maxCastableLevel = spellSlots.reduce((max, count, index) => (count > 0 ? index + 1 : max), 0);

  const sections = useMemo(
    () =>
      SPELL_LEVEL_LABELS.map(({ key, label, level }) => ({
        key,
        label,
        level,
        items: sortByLocalizedName(spells.filter((spell) => spell.level === level)),
      })),
    [spells]
  );

  const preparedCount = useMemo(() => {
    return spells.filter(
      (spell) => spell.level >= 1 && !domainSpellIds.has(spell.id) && character.spells[String(spell.id)]?.prepared
    ).length;
  }, [character.spells, spells, domainSpellIds]);

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
          <ThemedText style={[styles.statValue, { color: textColor }]}>{spellSaveDC ?? '—'}</ThemedText>
        </View>
        <View style={[styles.statBox, { borderColor: goldColor }]}>
          <ThemedText style={[styles.statLabel, { color: goldColor }]}>Bônus de Ataque</ThemedText>
          <ThemedText style={[styles.statValue, { color: textColor }]}>
            {spellAttackBonus != null ? formatSignedModifier(spellAttackBonus) : '—'}
          </ThemedText>
        </View>
        <View style={[styles.statBox, { borderColor: goldColor }]}>
          <ThemedText style={[styles.statLabel, { color: goldColor }]}>Preparadas</ThemedText>
          <ThemedText style={[styles.statValue, { color: textColor }]}>
            {preparedCount}/{maxPrepared}
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
                  max={spellSlots[section.level - 1] ?? 0}
                  used={character.spellSlotsUsed[String(section.level)] ?? 0}
                  onChange={(value) => setSpellSlotUsed(String(section.level), value)}
                />
              ) : undefined
            }
          >
            <View style={styles.cardList}>
              {items.map((spell) => {
                const isDomainSpell = domainSpellIds.has(spell.id);
                // Full-list casters (Cleric/Druid) see their whole class
                // list, but can't prepare a spell above the highest level
                // they currently have slots for.
                const isLevelLocked = isFullListCaster && spell.level > maxCastableLevel;
                const togglePreparedState = character.spells[String(spell.id)]?.prepared ?? false;
                const displayPrepared = isDomainSpell || togglePreparedState;
                // Once a class's known prepared limit is reached, only
                // unpreparing an already-prepared spell stays allowed. The
                // checkbox stays tappable either way (so the tap is
                // intercepted here instead of bubbling into the row's
                // "open spell detail" press) but warns and does nothing
                // when blocked, and renders dimmed via CheckboxToggle.
                // Domain spells are always prepared and can't be toggled at
                // all - they don't count against the limit either.
                const atCap = showRealStats && preparedCount >= maxPrepared;
                const canTogglePrepared = !isLevelLocked && (togglePreparedState || !atCap);

                return (
                  <Pressable
                    key={spell.id}
                    onPress={() =>
                      router.push({
                        pathname: '/sheet/[characterId]/spell/[id]',
                        params: { characterId: character.id, id: String(spell.id) },
                      })
                    }
                  >
                    <SpellRow
                      name={spell.name}
                      school={SPELL_SCHOOL_LABELS[spell.school] ?? spell.school}
                      ritual={spell.ritual}
                      prepared={section.level >= 1 ? displayPrepared : undefined}
                      preparedDimmed={section.level >= 1 && !isDomainSpell && !canTogglePrepared}
                      domainSpell={isDomainSpell}
                      onTogglePrepared={
                        section.level >= 1 && !isDomainSpell
                          ? () => {
                              if (isLevelLocked) {
                                setBlockedMessage(
                                  `Você ainda não tem espaços de magia de nível ${spell.level} — seu nível atual permite até o nível ${maxCastableLevel}.`
                                );
                              } else if (canTogglePrepared) {
                                toggleSpellPrepared(String(spell.id));
                              } else {
                                setBlockedMessage(
                                  `Você já preparou o máximo de ${maxPrepared} magia${maxPrepared === 1 ? '' : 's'} permitido para sua classe.`
                                );
                              }
                            }
                          : undefined
                      }
                    />
                  </Pressable>
                );
              })}
            </View>
          </CollapsibleSection>
        );
      })}

      <MessageModal
        visible={blockedMessage != null}
        title="Atenção"
        message={blockedMessage ?? undefined}
        onClose={() => setBlockedMessage(null)}
      />
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
