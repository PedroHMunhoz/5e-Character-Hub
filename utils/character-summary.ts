import type { CharacterClass } from '@/types/character';

export function formatClassesLabel(classes: CharacterClass[]): string {
  return classes
    .map((characterClass) => characterClass.name)
    .filter((name) => name.length > 0)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .join(' / ');
}
