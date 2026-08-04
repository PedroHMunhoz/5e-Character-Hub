import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import 'react-native-reanimated';

import { CharacterProvider } from '@/context/character-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
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
      assetSource={{ assetId: require('@/assets/data/dnd5e.db'), forceOverwrite: true }}>
      <CharacterProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </CharacterProvider>
    </SQLiteProvider>
  );
}
