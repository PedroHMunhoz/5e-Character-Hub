import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import 'react-native-reanimated';

import { CharacterDbProvider } from '@/context/character-db-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: 'characters',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    // Non-suspense mode: the suspense-based provider opens the database
    // synchronously during render, which races on web (OPFS only allows one
    // open access handle per file) whenever React re-renders before the
    // first open settles. This mode opens inside a useEffect instead, which
    // has proper open/close lifecycle handling.
    // forceOverwrite: true because assets/data/dnd5e.db is still actively
    // regenerated (import pipeline, translations) during development —
    // without it, a device/simulator that already has a copy from a
    // previous install keeps using that stale file forever.
    <SQLiteProvider
      databaseName="dnd5e.db"
      assetSource={{ assetId: require('@/assets/data/dnd5e.db'), forceOverwrite: true }}
    >
      {/* Own, hand-rolled context (not a nested SQLiteProvider - see
          context/character-db-context.tsx for why): player characters live
          in a separate, non-bundled database so they aren't wiped by the
          forceOverwrite above. CharacterProvider itself is mounted per
          character, inside app/sheet/[characterId]/_layout.tsx (it needs a
          characterId), not globally here. */}
      <CharacterDbProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="sheet/[characterId]" options={{ headerShown: false }} />
            <Stack.Screen name="wizard" options={{ presentation: 'modal', headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </CharacterDbProvider>
    </SQLiteProvider>
  );
}
