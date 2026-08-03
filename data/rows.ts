// Shared helpers for mapping raw SQLite rows (snake_case columns, 0/1
// booleans, JSON-serialized text columns) onto the camelCase domain types
// in types/reference.ts.

export function parseJson<T>(value: string | null | undefined): T | null {
  if (value == null) return null;
  return JSON.parse(value) as T;
}

export function toEntries(value: string | null | undefined): string[] {
  return parseJson<string[]>(value) ?? [];
}
