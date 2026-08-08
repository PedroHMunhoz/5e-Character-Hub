// Fallback for using MaterialIcons on Android and web.

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'person.fill': 'person',
  'bag.fill': 'backpack',
  'list.bullet': 'format-list-bulleted',
  'wand.and.sparkles': 'auto-fix-high',
  'square.and.pencil': 'edit',
  'shield.fill': 'shield',
  'chart.bar.fill': 'bar-chart',
} as IconMapping;

// Icons without a good MaterialIcons equivalent — rendered via MaterialCommunityIcons instead.
const COMMUNITY_OVERRIDES: Partial<Record<IconSymbolName, ComponentProps<typeof MaterialCommunityIcons>['name']>> = {
  'square.and.pencil': 'feather',
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const communityIcon = COMMUNITY_OVERRIDES[name];
  if (communityIcon) {
    return <MaterialCommunityIcons color={color} size={size} name={communityIcon} style={style} />;
  }
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
