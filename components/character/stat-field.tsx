import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface StatFieldProps {
  label: string;
  value: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

const FIELD_HEIGHT = 36;

export function StatField({ label, value, style, onPress }: StatFieldProps) {
  const goldColor = useThemeColor({}, 'gold');
  const Container = onPress ? Pressable : View;

  return (
    <Container style={[styles.container, { borderColor: goldColor }, style]} onPress={onPress}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <ThemedText style={[styles.value, { color: goldColor }]} numberOfLines={1}>
        {value}
      </ThemedText>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    height: FIELD_HEIGHT,
    borderWidth: 2,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  label: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  value: {
    minWidth: 40,
    marginLeft: 8,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '700',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
    opacity: 0.7,
  },
});
