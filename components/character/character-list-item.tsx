import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { PortraitPlaceholder } from '@/components/character/portrait-placeholder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

const PORTRAIT_HEIGHT_RATIO = 0.95;
const FALLBACK_PORTRAIT_SIZE = 56;

interface CharacterListItemProps {
  name: string;
  race: string;
  classesLabel: string;
  level: number;
  portraitUri: string;
  onPress: () => void;
}

export function CharacterListItem({ name, race, classesLabel, level, portraitUri, onPress }: CharacterListItemProps) {
  const goldColor = useThemeColor({}, 'gold');
  const subtitle = race ? `${race} • ${classesLabel}` : classesLabel;

  // Sized off the text column's own height (not the card's) so the portrait
  // can't feed back into the height it's measuring against - the text column
  // sizes to its 3 lines regardless of the portrait, since the row only
  // centers children instead of stretching them to match.
  const [infoHeight, setInfoHeight] = useState(0);
  const portraitSize = infoHeight > 0 ? infoHeight * PORTRAIT_HEIGHT_RATIO : FALLBACK_PORTRAIT_SIZE;

  function handleInfoLayout(event: LayoutChangeEvent) {
    setInfoHeight(event.nativeEvent.layout.height);
  }

  return (
    <Pressable onPress={onPress}>
      <ThemedView style={[styles.card, { borderColor: goldColor }]}>
        <PortraitPlaceholder style={{ width: portraitSize, height: portraitSize }} uri={portraitUri} />
        <View style={styles.info} onLayout={handleInfoLayout}>
          <ThemedText style={styles.name} numberOfLines={1}>
            {name}
          </ThemedText>
          <ThemedText style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </ThemedText>
          <ThemedText style={[styles.level, { color: goldColor }]}>{`Nível ${level}`}</ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.7,
  },
  level: {
    fontSize: 14,
    fontWeight: '700',
  },
});
