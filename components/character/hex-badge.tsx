import { StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatModifier } from '@/utils/format-modifier';

interface HexBadgeProps {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  formatAsModifier?: boolean;
  editable?: boolean;
  keyboardType?: KeyboardTypeOptions;
}

const HEX_WIDTH = 104;
const HEX_HEIGHT = 44;
const HEX_POINTS = [
  [HEX_WIDTH / 2, 0],
  [HEX_WIDTH, HEX_HEIGHT * 0.32],
  [HEX_WIDTH, HEX_HEIGHT * 0.68],
  [HEX_WIDTH / 2, HEX_HEIGHT],
  [0, HEX_HEIGHT * 0.68],
  [0, HEX_HEIGHT * 0.32],
]
  .map(([x, y]) => `${x},${y}`)
  .join(' ');

export function HexBadge({
  label,
  value,
  onChangeText,
  formatAsModifier,
  editable = true,
  keyboardType = 'default',
}: HexBadgeProps) {
  const borderColor = useThemeColor({}, 'icon');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={styles.container}>
      <View style={styles.hexWrapper}>
        <Svg width={HEX_WIDTH} height={HEX_HEIGHT} style={StyleSheet.absoluteFill}>
          <Polygon points={HEX_POINTS} fill={backgroundColor} stroke={borderColor} strokeWidth={2} />
        </Svg>
        <TextInput
          style={[styles.input, { color: textColor }, !editable && styles.readOnlyInput]}
          value={value}
          onChangeText={onChangeText}
          onBlur={editable && formatAsModifier && onChangeText ? () => onChangeText(formatModifier(value)) : undefined}
          editable={editable}
          keyboardType={keyboardType}
        />
      </View>
      <ThemedText style={styles.label}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  hexWrapper: {
    width: HEX_WIDTH,
    height: HEX_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: HEX_WIDTH * 0.82,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  readOnlyInput: {
    opacity: 0.7,
  },
  label: {
    fontSize: 10,
    textTransform: 'uppercase',
    opacity: 0.7,
    textAlign: 'center',
  },
});
