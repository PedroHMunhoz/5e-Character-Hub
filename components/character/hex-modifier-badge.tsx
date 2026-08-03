import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface HexModifierBadgeProps {
  value: string;
  valueColor?: string;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

const WIDTH = 56;
const HEIGHT = 40;
const HEX_POINTS = `${WIDTH * 0.28},2 ${WIDTH * 0.72},2 ${WIDTH - 2},${HEIGHT / 2} ${WIDTH * 0.72},${HEIGHT - 2} ${WIDTH * 0.28},${HEIGHT - 2} 2,${HEIGHT / 2}`;

export function HexModifierBadge({ value, valueColor, label, style }: HexModifierBadgeProps) {
  const goldColor = useThemeColor({}, 'gold');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={[styles.wrapper, style]}>
      {label ? <ThemedText style={styles.label}>{label}</ThemedText> : null}
      <View style={styles.container}>
        <Svg width={WIDTH} height={HEIGHT} style={StyleSheet.absoluteFill}>
          <Polygon points={HEX_POINTS} fill={backgroundColor} stroke={goldColor} strokeWidth={2} />
        </Svg>
        <ThemedText style={[styles.value, { color: valueColor ?? textColor }]}>{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: 2 },
  container: { width: WIDTH, height: HEIGHT, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10, textTransform: 'uppercase', opacity: 0.7, textAlign: 'center' },
  value: { fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
