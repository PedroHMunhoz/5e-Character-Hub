import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ItemIconPlaceholder } from '@/components/character/item-icon-placeholder';
import { ThemedText } from '@/components/themed-text';
import { getSpellDetailById, type SpellDetail } from '@/data/queries/spell-detail';
import { useThemeColor } from '@/hooks/use-theme-color';

const GRID_GAP = 12;
const HEADER_GAP = 12;
const HEADER_ICON_RATIO = 0.3;

// Same measured-width approach used by app/item/[id].tsx and app/feature/[id].tsx -
// `flex`/`%` proved unreliable at splitting a row evenly on this app's native
// Yoga runtime.
function GridRow({ left, right }: { left: ReactNode; right: ReactNode }) {
  const [width, setWidth] = useState(0);
  const cellWidth = width > 0 ? (width - GRID_GAP) / 2 : undefined;

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <View style={styles.gridRow} onLayout={handleLayout}>
      <View style={cellWidth != null ? { width: cellWidth } : styles.gridCellFallback}>{left}</View>
      <View style={{ width: GRID_GAP }} />
      <View style={cellWidth != null ? { width: cellWidth } : styles.gridCellFallback}>{right}</View>
    </View>
  );
}

function HeaderRow({ icon, fields }: { icon: ReactNode; fields: ReactNode }) {
  const [width, setWidth] = useState(0);
  const iconWidth = width > 0 ? Math.round((width - HEADER_GAP) * HEADER_ICON_RATIO) : undefined;
  const fieldsWidth = width > 0 && iconWidth != null ? width - HEADER_GAP - iconWidth : undefined;

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <View style={styles.headerRow} onLayout={handleLayout}>
      <View style={iconWidth != null ? { width: iconWidth } : styles.gridCellFallback}>{icon}</View>
      <View style={{ width: HEADER_GAP }} />
      <View style={fieldsWidth != null ? { width: fieldsWidth } : styles.headerFieldsFallback}>{fields}</View>
    </View>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  const goldColor = useThemeColor({}, 'gold');
  return (
    <View style={[styles.field, { borderColor: goldColor }]}>
      <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      <ThemedText style={styles.fieldValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {value}
      </ThemedText>
    </View>
  );
}

export default function SpellDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const goldColor = useThemeColor({}, 'gold');

  const [spell, setSpell] = useState<SpellDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const numericId = Number(id);
    let cancelled = false;

    async function load() {
      const detail = await getSpellDetailById(db, numericId);
      if (!cancelled) {
        setSpell(detail);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [db, id]);

  if (loading || !spell) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={goldColor} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: spell.name }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
        <HeaderRow
          icon={<ItemIconPlaceholder fill />}
          fields={
            <View style={styles.headerFields}>
              <Field label="Nível" value={spell.levelLabel} />
              <Field label="Escola" value={spell.schoolLabel} />
              <Field label="Tempo de Conjuração" value={spell.castingTimeLabel} />
            </View>
          }
        />

        <GridRow
          left={<Field label="Alcance" value={spell.rangeLabel} />}
          right={<Field label="Duração" value={spell.durationLabel} />}
        />

        <View style={[styles.field, { borderColor: goldColor }]}>
          <ThemedText style={styles.fieldLabel}>Componentes</ThemedText>
          <ThemedText style={styles.fieldValue}>{spell.componentsLabel}</ThemedText>
        </View>

        <View style={[styles.field, styles.descriptionField, { borderColor: goldColor }]}>
          <ThemedText style={styles.fieldLabel}>Detalhes</ThemedText>
          {spell.entries.map((entry, index) => (
            <ThemedText key={index} style={styles.descriptionParagraph}>
              {entry}
            </ThemedText>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    padding: 16,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    width: '100%',
  },
  headerFields: {
    gap: 8,
  },
  headerFieldsFallback: {
    flex: 3,
  },
  gridRow: {
    flexDirection: 'row',
    width: '100%',
  },
  gridCellFallback: {
    flex: 1,
  },
  field: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  descriptionField: {
    gap: 8,
  },
  descriptionParagraph: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
  },
});
