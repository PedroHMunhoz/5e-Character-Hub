import { Pressable, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

import { CharacterList } from '@/components/character/character-list';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

function HeaderAddButton() {
  const goldColor = useThemeColor({}, 'gold');

  return (
    <Pressable onPress={() => {}} hitSlop={8} style={styles.headerButton}>
      <IconSymbol name="plus" size={24} color={goldColor} />
    </Pressable>
  );
}

export default function CharactersScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Personagens', headerRight: () => <HeaderAddButton /> }} />
      <CharacterList />
    </>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    paddingHorizontal: 4,
  },
});
