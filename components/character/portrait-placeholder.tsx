import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { useThemeColor } from '@/hooks/use-theme-color';

const PLACEHOLDER_URI = 'https://placecage.lucidinternets.com/700/600';

interface PortraitPlaceholderProps {
  style?: StyleProp<ViewStyle>;
}

export function PortraitPlaceholder({ style }: PortraitPlaceholderProps) {
  const borderColor = useThemeColor({}, 'gold');

  return (
    <View style={[styles.container, { borderColor }, style]}>
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
