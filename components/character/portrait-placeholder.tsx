import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { useThemeColor } from '@/hooks/use-theme-color';

const PLACEHOLDER_URI = 'https://placecage.lucidinternets.com/700/600';

export function PortraitPlaceholder() {
  const borderColor = useThemeColor({}, 'icon');

  return (
    <View style={[styles.container, { borderColor }]}>
      <Image source={{ uri: PLACEHOLDER_URI }} style={styles.image} contentFit="cover" />
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
