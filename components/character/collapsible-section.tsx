import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
}

export function CollapsibleSection({ title, children, defaultExpanded = true }: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.section}>
      <Pressable onPress={() => setExpanded((value) => !value)}>
        <ThemedText type="subtitle">{title}</ThemedText>
      </Pressable>
      {expanded ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  content: {
    gap: 8,
  },
});
