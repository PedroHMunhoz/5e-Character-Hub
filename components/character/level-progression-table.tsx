import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { LevelProgressionTableData } from '@/constants/level-progression-tables';

// Equal-width columns via measured layout, not `flex`/`%` - same technique
// GridRow (app/sheet/[characterId]/item/[id].tsx) uses for 2 columns,
// generalized to N, since flex/% proved unreliable at splitting a row
// evenly on this app's native Yoga runtime.
export function LevelProgressionTable({ title, columns, rows }: LevelProgressionTableData) {
  const goldColor = useThemeColor({}, 'gold');
  const [width, setWidth] = useState(0);
  const colWidth = width > 0 ? width / columns.length : undefined;

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <View style={styles.wrapper}>
      {title ? <ThemedText style={styles.title}>{title}</ThemedText> : null}
      <View style={[styles.table, { borderColor: goldColor }]} onLayout={handleLayout}>
        <View style={[styles.row, styles.headerRow, { borderColor: goldColor }]}>
          {columns.map((col, index) => (
            <ThemedText
              key={index}
              style={[styles.headerCell, colWidth != null && { width: colWidth }]}
            >
              {col}
            </ThemedText>
          ))}
        </View>
        {rows.map((row, rowIndex) => (
          <View
            key={rowIndex}
            style={[
              styles.row,
              rowIndex < rows.length - 1 && { borderBottomWidth: 1, borderColor: `${goldColor}33` },
            ]}
          >
            {row.map((cell, cellIndex) => (
              <ThemedText key={cellIndex} style={[styles.cell, colWidth != null && { width: colWidth }]}>
                {cell}
              </ThemedText>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    opacity: 0.85,
  },
  table: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  headerRow: {
    borderBottomWidth: 1,
  },
  headerCell: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  cell: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.9,
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontVariant: ['tabular-nums'],
  },
});
