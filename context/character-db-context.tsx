import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import * as SQLite from 'expo-sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

// Metro has no loader for raw .sql text (unlike db/schema.sql, which is only
// ever read by scripts/import-5e-data.mjs via Node's fs - "Never runs
// on-device", per its own comment). This runs on-device, at app startup, so
// the statement is inlined here instead. Keep this in sync with
// db/app-schema.sql, which stays the documented source of truth.
const APP_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS player_characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  race_name TEXT NOT NULL,
  classes_summary TEXT NOT NULL,
  sheet_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

// A second, app-owned database, separate from the bundled reference
// database (`dnd5e.db`, opened via expo-sqlite's own `SQLiteProvider` in
// app/_layout.tsx). That one is force-overwritten from its bundled asset on
// every load (see the comment there) because it's actively regenerated
// during development - if player characters lived in that same file, they'd
// be wiped every time. `characters.db` has no assetSource: it's created
// empty on first run and only ever touched by CREATE TABLE IF NOT EXISTS.
//
// This can't reuse expo-sqlite's own `SQLiteProvider`/`useSQLiteContext()`:
// that hook reads a single, non-namespaced context exported by the library,
// so nesting a second `SQLiteProvider` with a different databaseName would
// just shadow the outer one for the whole subtree instead of coexisting
// with it. Opening the connection directly with `openDatabaseAsync` and
// exposing it through our own context avoids that collision.

const CharacterDbContext = createContext<SQLiteDatabase | undefined>(undefined);

export function CharacterDbProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const goldColor = useThemeColor({}, 'gold');

  useEffect(() => {
    let cancelled = false;

    SQLite.openDatabaseAsync('characters.db')
      .then(async (database) => {
        await database.execAsync(APP_SCHEMA_SQL);
        if (!cancelled) setDb(database);
      })
      .catch((err: Error) => {
        // Surfaced in the UI below rather than left as a silent, unhandled
        // rejection - that previously left the whole app stuck on a blank
        // screen forever (CharacterDbProvider blocks every screen, since
        // it wraps the router's root Stack) with no indication of why.
        console.error('[CharacterDbProvider] failed to open characters.db', err);
        if (!cancelled) setError(err);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText style={styles.errorTitle}>Não foi possível abrir o banco de personagens.</ThemedText>
        <ThemedText style={styles.errorMessage}>{error.message}</ThemedText>
      </ThemedView>
    );
  }

  if (!db) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={goldColor} />
      </ThemedView>
    );
  }

  return <CharacterDbContext.Provider value={db}>{children}</CharacterDbContext.Provider>;
}

export function useCharacterDb(): SQLiteDatabase {
  const db = useContext(CharacterDbContext);
  if (!db) {
    throw new Error('useCharacterDb must be used within a CharacterDbProvider');
  }
  return db;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 13,
    opacity: 0.7,
    textAlign: 'center',
  },
});
