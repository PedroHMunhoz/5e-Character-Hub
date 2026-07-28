import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ProgressBarProps {
  current: string;
  max: string;
  extra?: string;
}

export function ProgressBar({ current, max, extra }: ProgressBarProps) {
  const borderColor = useThemeColor({}, 'icon');
  const fillColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  const currentNum = parseInt(current, 10) || 0;
  const maxNum = parseInt(max, 10) || 0;
  const extraNum = extra ? parseInt(extra, 10) || 0 : 0;
  const ratio = maxNum > 0 ? Math.min(currentNum / maxNum, 1) : 0;

  return (
    <View style={styles.row}>
      <View style={[styles.track, { borderColor, backgroundColor }]}>
        <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: fillColor }]} />
        <View style={styles.labelOverlay}>
          <ThemedText style={styles.labelText}>
            {current || 0} / {max || 0}
          </ThemedText>
        </View>
      </View>
      {extra !== undefined ? (
        extraNum > 0 ? (
          <View style={[styles.extra, { borderColor, backgroundColor: fillColor }]}>
            <ThemedText style={[styles.extraText, { color: backgroundColor }]}>{extraNum}</ThemedText>
          </View>
        ) : (
          <View style={[styles.extra, { borderColor }]}>
            <ThemedText style={[styles.extraText, styles.extraPlaceholder, { color: borderColor }]}>TMP</ThemedText>
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
    height: 28,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  labelOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelText: {
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  extra: {
    minWidth: 36,
    height: 28,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  extraText: {
    fontSize: 13,
    fontWeight: '700',
  },
  extraPlaceholder: {
    fontSize: 10,
  },
});
