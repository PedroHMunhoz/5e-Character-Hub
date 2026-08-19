import { describe, expect, it } from 'vitest';

import { getAllRaces, getRaceById } from '@/data/queries/races';
import { openReferenceDb } from './sqlite-adapter';

describe('sqlite-adapter smoke test', () => {
  it('opens the bundled reference db and runs a real query layer function', async () => {
    const db = openReferenceDb();
    try {
      const races = await getAllRaces(db);
      expect(races.length).toBeGreaterThan(0);
      const first = await getRaceById(db, races[0].id);
      expect(first?.id).toBe(races[0].id);
    } finally {
      db.close();
    }
  });
});
