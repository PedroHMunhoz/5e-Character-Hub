-- App-owned database schema (player-created data).
-- Sibling to db/schema.sql, which is the read-only bundled reference
-- database (regenerated from source on each build - see docs/data-schema.md
-- for why the two must never live in the same file).
--
-- This file is the documented source of truth, mirrored the same way
-- db/schema.sql is: unlike that file (only ever read by
-- scripts/import-5e-data.mjs via Node, never on-device), this schema DOES
-- need to run on-device at app startup, and Metro has no loader for raw
-- .sql text - so the actual statement executed is inlined as a JS string
-- in context/character-db-context.tsx. Keep the two in sync by hand.

CREATE TABLE IF NOT EXISTS player_characters (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  race_name TEXT NOT NULL,
  classes_summary TEXT NOT NULL,
  sheet_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
