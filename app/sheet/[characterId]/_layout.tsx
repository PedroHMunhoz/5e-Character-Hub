import { Redirect, Stack, useLocalSearchParams } from 'expo-router';

import { CharacterProvider } from '@/context/character-context';

// item/[id], feature/[id] and spell/[id] are nested here (not siblings at
// the root, where they used to live) so they inherit CharacterProvider via
// normal component-tree nesting when pushed from within the sheet - see
// character-inventory.tsx/character-features.tsx/character-spells.tsx. A
// characterId living only in the root layout's params wouldn't be visible
// to those pushed screens otherwise.
//
// characterId is a real dynamic path segment (this folder is literally
// named `[characterId]`), not a loose search param - a previous version of
// this route was a bare `/sheet` with characterId passed only as a search
// param, which neither useLocalSearchParams nor useGlobalSearchParams
// picked up reliably once router.push resolved `/sheet` down to its nested
// (tabs) default child, causing every navigation here to silently bounce
// back to the character list. Making the id part of the matched path itself
// removes that ambiguity - it's always present wherever this segment matches.
export default function SheetLayout() {
  const { characterId } = useLocalSearchParams<{ characterId: string }>();

  // No characterId isn't a valid state to render, but with characterId now
  // a required path segment this should only happen from a restored/stale
  // navigation state pointing at a route this build no longer supports
  // reaching directly. Bounce back to the character list instead of trying
  // to load `undefined` and getting stuck.
  if (!characterId) {
    return <Redirect href="/characters" />;
  }

  return (
    <CharacterProvider characterId={characterId}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="item/[id]" />
        <Stack.Screen name="feature/[id]" />
        <Stack.Screen name="feat/[id]" />
        <Stack.Screen name="spell/[id]" />
      </Stack>
    </CharacterProvider>
  );
}
