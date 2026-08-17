// 5etools only stores the distinguishing word in a subrace's own `name`
// (e.g. "Hill", "High") - it never composes that with the parent race's
// name anywhere in the data, so the app has to. Keyed by the subrace's raw
// English name (types/reference.ts's Race.englishName) since that's stable
// across reimports/translation edits, unlike `id` or the translated name.
//
// Covers every PHB subrace that survives data/queries/races.ts's PHB-only
// filter (see docs/TODO.md for the note on other sourcebooks) -
// Dragonborn/Half-Elf/Half-Orc/Tiefling have none (Dragonborn's Draconic
// Ancestry is a separate wizard step, not modeled as a subrace at all - see
// constants/draconic-ancestry.ts). Human has one real subrace, "Variant"
// (Variant Human) - the standard Human's own +1-to-all bonus lives directly
// on the base race (see scripts/import-5e-data.mjs), so it has none of its
// own either.
export const SUBRACE_DISPLAY_NAME_BY_ENGLISH_NAME: Record<string, string> = {
  Hill: 'Anão da Colina',
  Mountain: 'Anão da Montanha',
  High: 'Alto Elfo',
  Wood: 'Elfo da Floresta',
  Drow: 'Drow',
  Forest: 'Gnomo da Floresta',
  Rock: 'Gnomo das Rochas',
  Lightfoot: 'Halfling Pés-Leves',
  Stout: 'Halfling Robusto',
  Variant: 'Humano (Variante)',
};

export function getSubraceDisplayName(englishName: string, translatedFallback: string): string {
  return SUBRACE_DISPLAY_NAME_BY_ENGLISH_NAME[englishName] ?? translatedFallback;
}
