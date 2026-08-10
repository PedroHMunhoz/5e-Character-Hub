// SQL's `ORDER BY name` sorts by the raw English column - the wizard's
// pickers display the pt-BR translated name instead, so the visual order
// doesn't match unless re-sorted client-side after translation.
export function sortByLocalizedName<T extends { name: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
