// Races that grant a feat choice at level 1. Not modeled anywhere in the
// database (races has no "grants a feat" column - the PHB's only case,
// Variant Human, encodes it via 5etools' `feats: [{"any":1}]` race field,
// which scripts/import-5e-data.mjs doesn't import at all), so this is a
// plain constant keyed by Race.englishName - same spirit as
// constants/draconic-ancestry.ts. Easy to extend if another sourcebook's
// race/subrace grants a feat too.
export const RACES_THAT_GRANT_A_FEAT = new Set<string>(['Variant']);
