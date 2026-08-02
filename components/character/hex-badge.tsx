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

const HEX_WIDTH = 82;
const HEX_HEIGHT = 52;
const HEX_POINTS = `${HEX_WIDTH * 0.28},2 ${HEX_WIDTH * 0.72},2 ${HEX_WIDTH - 2},${HEX_HEIGHT / 2} ${HEX_WIDTH * 0.72},${HEX_HEIGHT - 2} ${HEX_WIDTH * 0.28},${HEX_HEIGHT - 2} 2,${HEX_HEIGHT / 2}`;

export function HexBadge({
  label,
  value,
  onChangeText,
  formatAsModifier,
  editable = true,
  keyboardType = 'default',
}: HexBadgeProps) {
  const goldColor = useThemeColor({}, 'gold');
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <View style={styles.container}>
      <View style={styles.hexWrapper}>
        <Svg width={HEX_WIDTH} height={HEX_HEIGHT} style={StyleSheet.absoluteFill} pointerEvents="none">
          <Polygon points={HEX_POINTS} fill={backgroundColor} stroke={goldColor} strokeWidth={2} />
        </Svg>
        <TextInput
          style={[styles.input, { color: goldColor }, !editable && styles.readOnlyInput]}
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
    position: 'relative',
    zIndex: 1,
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
