import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface ColumnDefinition {
  label: string;
  width: number;
}

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  columns?: ColumnDefinition[];
  right?: ReactNode;
}

export function CollapsibleSection({
  title,
  children,
  defaultExpanded = true,
  columns,
  right,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.section}>
      <Pressable
        style={columns ? styles.headerWithColumns : styles.header}
        onPress={() => setExpanded((value) => !value)}>
        <ThemedText type="subtitle">{title}</ThemedText>
        {right ?? null}
        {columns ? (
          <View style={styles.columns}>
            {columns.map((column) => (
              <ThemedText key={column.label} style={[styles.columnLabel, { width: column.width }]}>
                {column.label}
              </ThemedText>
            ))}
          </View>
        ) : null}
      </Pressable>
      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerWithColumns: {
    flexDirection: 'column',
    gap: 4,
    paddingHorizontal: 8,
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  columnLabel: {
    fontSize: 12,
    fontWeight: '700',
    opacity: 0.7,
    textAlign: 'center',
  },
  content: {
    gap: 8,
  },
});
