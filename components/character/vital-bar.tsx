import { useId, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface VitalBarProps {
  label: string;
  current: string;
  max: string;
  gradientColors: [string, string];
  extra?: string;
  onPress?: () => void;
}

const TRACK_HEIGHT = 36;
const TRACK_EMPTY_COLOR = '#1a1a1a';

export function VitalBar({ label, current, max, gradientColors, extra, onPress }: VitalBarProps) {
  const goldColor = useThemeColor({}, 'gold');
  const gradientId = `vitalFill${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [trackWidth, setTrackWidth] = useState(0);
  const TrackContainer = onPress ? Pressable : View;

  const currentNum = parseInt(current, 10) || 0;
  const maxNum = parseInt(max, 10) || 0;
  const extraNum = extra ? parseInt(extra, 10) || 0 : 0;
  const ratio = maxNum > 0 ? Math.min(currentNum / maxNum, 1) : 0;

  function handleLayout(event: LayoutChangeEvent) {
    setTrackWidth(event.nativeEvent.layout.width);
  }

  return (
    <View style={styles.row}>
      <TrackContainer style={[styles.track, { borderColor: goldColor }]} onLayout={handleLayout} onPress={onPress}>
        {trackWidth > 0 ? (
          <Svg width={trackWidth} height={TRACK_HEIGHT} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient
                id={gradientId}
                x1={0}
                y1={0}
                x2={trackWidth}
                y2={TRACK_HEIGHT}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0" stopColor={gradientColors[0]} />
                <Stop offset="1" stopColor={gradientColors[1]} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={trackWidth} height={TRACK_HEIGHT} fill={TRACK_EMPTY_COLOR} />
            <Rect x={0} y={0} width={trackWidth * ratio} height={TRACK_HEIGHT} fill={`url(#${gradientId})`} />
          </Svg>
        ) : null}
        <View style={styles.content}>
          <ThemedText style={styles.label}>{label}</ThemedText>
          <ThemedText style={[styles.value, { color: goldColor }]}>
            {current || 0} / {max || 0}
          </ThemedText>
        </View>
      </TrackContainer>
      {extra !== undefined ? (
        extraNum > 0 ? (
          <View style={[styles.extra, { borderColor: goldColor }]}>
            <ThemedText style={[styles.extraText, { color: goldColor }]}>{extraNum}</ThemedText>
          </View>
        ) : (
          <View style={[styles.extra, { borderColor: goldColor }]}>
            <ThemedText style={[styles.extraText, styles.extraPlaceholder, { color: goldColor }]}>TMP</ThemedText>
          </View>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  track: {
    flex: 1,
    height: TRACK_HEIGHT,
    borderWidth: 2,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    opacity: 0.7,
  },
  extra: {
    minWidth: 36,
    height: TRACK_HEIGHT,
    borderWidth: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  extraText: {
    fontSize: 11,
    fontWeight: '700',
  },
  extraPlaceholder: {
    fontSize: 8,
  },
});
