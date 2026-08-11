// SQL's `ORDER BY name` sorts by the raw English column - the wizard's
// pickers display the pt-BR translated name instead, so the visual order
// doesn't match unless re-sorted client-side after translation.
export function sortByLocalizedName<T extends { name: string }>(
  list: T[],
  getKey: (item: T) => string = (item) => item.name
): T[] {
  return [...list].sort((a, b) => getKey(a).localeCompare(getKey(b), 'pt-BR'));
}

// PHB subclass names all follow "<Título> d[a/o/e][s] <Nome>" (ex. "Domínio
// do Conhecimento", "Escola de Abjuração") - sorting by the full string puts
// "do Conhecimento" after every "da X" entry, breaking the alphabetical
// expectation for the part that actually varies. Strips that shared
// prefix when present so ordering follows the meaningful word instead;
// names without the pattern (ex. "Campeão", "A Arquifada") sort unchanged.
const SUBCLASS_TITLE_PREFIX = /^\S+\s+d[aeo]s?\s+/i;

export function subclassSortKey(name: string): string {
  return name.replace(SUBCLASS_TITLE_PREFIX, '');
}
