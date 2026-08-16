// Ranger "Natural Explorer" (PHB p.91, class_features id 243) - the favored
// terrain choice (8 biomes) is embedded as running prose in the class
// feature's own entries, same situation as constants/favored-enemy.ts (see
// that file's header comment for the full rationale). Labels reuse the exact
// pt-BR vocabulary already established by the translated class_features
// entries for this same feature (translations table, entity_type=
// 'class_feature', entity_id=243) - including "o Subterrâneo" (capitalized,
// with article) for Underdark, not "Submundo". blurbPt is new content: a
// one-sentence gloss describing the biome.
export interface FavoredTerrainOption {
  key: string;
  labelPt: string;
  blurbPt: string;
}

export const FAVORED_TERRAINS: FavoredTerrainOption[] = [
  { key: 'arctic', labelPt: 'Ártico', blurbPt: 'Terras geladas de neve e gelo perpétuos.' },
  { key: 'coast', labelPt: 'Litoral', blurbPt: 'Praias, recifes e águas costeiras.' },
  { key: 'desert', labelPt: 'Deserto', blurbPt: 'Extensões áridas de areia ou rocha.' },
  { key: 'forest', labelPt: 'Floresta', blurbPt: 'Bosques densos de árvores.' },
  { key: 'grassland', labelPt: 'Planície', blurbPt: 'Campos abertos e savanas, sem muito abrigo.' },
  { key: 'mountain', labelPt: 'Montanha', blurbPt: 'Picos rochosos, colinas altas e passagens de montanha.' },
  { key: 'swamp', labelPt: 'Pântano', blurbPt: 'Terrenos alagados e lamacentos.' },
  { key: 'underdark', labelPt: 'Subterrâneo', blurbPt: 'As vastas cavernas e túneis abaixo da superfície.' },
];

function findFavoredTerrain(key: string): FavoredTerrainOption | null {
  return FAVORED_TERRAINS.find((option) => option.key === key) ?? null;
}

export function formatFavoredTerrainFeatureName(terrain: string | null): string | null {
  if (!terrain) return null;
  const option = findFavoredTerrain(terrain);
  return option ? `Explorador Natural: ${option.labelPt}` : null;
}

export function getFavoredTerrainDetailEntries(terrain: string | null): string[] {
  if (!terrain) return [];
  const option = findFavoredTerrain(terrain);
  return option ? [`${option.labelPt}: ${option.blurbPt}`] : [];
}
