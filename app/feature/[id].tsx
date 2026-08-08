import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ItemIconPlaceholder } from '@/components/character/item-icon-placeholder';
import { ThemedText } from '@/components/themed-text';
import { formatRecovery } from '@/constants/feature-usage-overrides';
import { getFeatureDetailById, type FeatureDetail } from '@/data/queries/feature-detail';
import { useCharacter } from '@/hooks/use-character';
import { useThemeColor } from '@/hooks/use-theme-color';

const GRID_GAP = 12;
const HEADER_GAP = 12;
const HEADER_ICON_RATIO = 0.3;

// Same measured-width approach used by app/item/[id].tsx - `flex`/`%` proved
// unreliable at splitting a row evenly on this app's native Yoga runtime.
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

export default function FeatureDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const { character } = useCharacter();
  const goldColor = useThemeColor({}, 'gold');

  const [feature, setFeature] = useState<FeatureDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const detail = await getFeatureDetailById(db, id);
      if (!cancelled) {
        setFeature(detail);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [db, id]);

  if (loading || !feature) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={goldColor} />
      </View>
    );
  }

  const isActive = feature.usageType === 'ativa';
  const usesCurrent = character.features[feature.id]?.usesCurrent ?? feature.maxUses ?? '0';
  const categoryValue =
    feature.level != null ? `${feature.categoryLabel} (Nível ${feature.level})` : feature.categoryLabel;

  return (
    <>
      <Stack.Screen options={{ title: feature.name }} />
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.container}>
        <HeaderRow
          icon={<ItemIconPlaceholder fill />}
          fields={
            <View style={styles.headerFields}>
              <Field label="Categoria" value={categoryValue} />
              <Field label="Tipo" value={isActive ? 'Ativa' : 'Passiva'} />
            </View>
          }
        />

        {isActive ? (
          <GridRow
            left={<Field label="Usos" value={feature.maxUses ? `${usesCurrent}/${feature.maxUses}` : usesCurrent} />}
            right={<Field label="Recarga" value={formatRecovery(feature.recovery)} />}
          />
        ) : null}

        <View style={[styles.field, styles.descriptionField, { borderColor: goldColor }]}>
          <ThemedText style={styles.fieldLabel}>Descrição</ThemedText>
          {feature.entries.map((entry, index) => (
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
