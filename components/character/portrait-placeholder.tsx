import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { useThemeColor } from '@/hooks/use-theme-color';

const MIN_DIMENSION = 200;
const MAX_DIMENSION = 500;

function randomDimension(): number {
  return Math.floor(Math.random() * (MAX_DIMENSION - MIN_DIMENSION + 1)) + MIN_DIMENSION;
}

export function getRandomPortraitUri(): string {
  return `https://placecage.lucidinternets.com/${randomDimension()}/${randomDimension()}`;
}

// Randomized once per app launch (module scope, not per render/mount) so the
// portrait stays the same while navigating around but changes on the next
// app open.
const PLACEHOLDER_URI = getRandomPortraitUri();

interface PortraitPlaceholderProps {
  style?: StyleProp<ViewStyle>;
  uri?: string;
}

export function PortraitPlaceholder({ style, uri }: PortraitPlaceholderProps) {
  const borderColor = useThemeColor({}, 'gold');

  return (
    <View style={[styles.container, { borderColor }, style]}>
      <Image source={{ uri: uri ?? PLACEHOLDER_URI }} style={styles.image} contentFit="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 96,
    height: 96,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
