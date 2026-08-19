// Test-only stand-in for expo-sqlite's SQLiteDatabase, backed by Node's
// built-in node:sqlite (DatabaseSync) instead of the native Expo module -
// lets data/queries/* and data/wizard/* run unmodified under Vitest, in
// plain Node, against the real bundled reference database
// (assets/data/dnd5e.db). Never imported by app code - test infra only.
//
// Only getAllAsync/getFirstAsync are implemented: those are the only two
// methods any file under data/queries/* or data/wizard/* calls against the
// reference db (confirmed by grep - execAsync/runAsync only appear in
// data/queries/player-characters.ts, which talks to the separate
// characters.db and isn't exercised by this suite).
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { SQLInputValue } from 'node:sqlite';
import type { SQLiteDatabase } from 'expo-sqlite';

// expo-sqlite's getAllAsync/getFirstAsync accept EITHER a single array of
// bind params OR a variadic list of scalar params (see SQLiteDatabase.d.ts's
// two overloads) - data/queries/* uses both styles interchangeably, so this
// normalizes either shape into the flat positional list node:sqlite's
// statement.all/get(...params) expects. Every caller only ever passes
// string/number/null bind values (verified against every data/queries/*
// call site) - the `unknown` comes from expo-sqlite's own loosely-typed
// variadic signature, not from any real non-SQL-safe value reaching here.
function normalizeBindArgs(params: unknown[]): SQLInputValue[] {
  const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
  return flat as SQLInputValue[];
}

export interface TestSQLiteDatabase {
  getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]>;
  getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null>;
  close(): void;
}

const DEFAULT_DB_PATH = path.resolve(__dirname, '../../assets/data/dnd5e.db');

function buildAdapter(dbPath: string): TestSQLiteDatabase {
  const db = new DatabaseSync(dbPath, { readOnly: true });

  return {
    async getAllAsync<T>(source: string, ...params: unknown[]): Promise<T[]> {
      const stmt = db.prepare(source);
      return stmt.all(...normalizeBindArgs(params)) as T[];
    },
    async getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null> {
      const stmt = db.prepare(source);
      const row = stmt.get(...normalizeBindArgs(params));
      return (row as T | undefined) ?? null;
    },
    close() {
      db.close();
    },
  };
}

// Cast to expo-sqlite's SQLiteDatabase so this drops straight into
// data/queries/* and data/wizard/* call sites without touching their
// signatures - only getAllAsync/getFirstAsync are ever invoked against the
// reference db (see file header), so the rest of the real interface is
// never exercised.
export function openReferenceDb(dbPath: string = DEFAULT_DB_PATH): SQLiteDatabase & { close(): void } {
  return buildAdapter(dbPath) as unknown as SQLiteDatabase & { close(): void };
}
