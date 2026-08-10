// PHB p.34 "Draconic Ancestry" table - not modeled as a subrace (5etools
// generates these 10 via an unexpanded `_versions`/`_implementations`
// template, see scripts/import-5e-data.mjs's races section), so it's a
// plain constant, picked in a dedicated wizard step instead. Distance
// conversion (ft -> m) follows the same flat 0,3 factor already used
// elsewhere for printed pt-BR conversions (see data/queries/base-items.ts's
// convertRangeToMeters).
export interface DraconicAncestryOption {
  key: string;
  labelPt: string;
  damageTypePt: string;
  breathWeaponPt: string;
}

export const DRACONIC_ANCESTRIES: DraconicAncestryOption[] = [
  { key: 'black', labelPt: 'Preto', damageTypePt: 'Ácido', breathWeaponPt: 'Linha de 1,5 x 9 m (Destreza)' },
  { key: 'blue', labelPt: 'Azul', damageTypePt: 'Elétrico', breathWeaponPt: 'Linha de 1,5 x 9 m (Destreza)' },
  { key: 'brass', labelPt: 'Latão', damageTypePt: 'Fogo', breathWeaponPt: 'Linha de 1,5 x 9 m (Destreza)' },
  { key: 'bronze', labelPt: 'Bronze', damageTypePt: 'Elétrico', breathWeaponPt: 'Linha de 1,5 x 9 m (Destreza)' },
  { key: 'copper', labelPt: 'Cobre', damageTypePt: 'Ácido', breathWeaponPt: 'Linha de 1,5 x 9 m (Destreza)' },
  { key: 'gold', labelPt: 'Dourado', damageTypePt: 'Fogo', breathWeaponPt: 'Cone de 4,5 m (Destreza)' },
  { key: 'green', labelPt: 'Verde', damageTypePt: 'Veneno', breathWeaponPt: 'Cone de 4,5 m (Constituição)' },
  { key: 'red', labelPt: 'Vermelho', damageTypePt: 'Fogo', breathWeaponPt: 'Cone de 4,5 m (Destreza)' },
  { key: 'silver', labelPt: 'Prateado', damageTypePt: 'Frio', breathWeaponPt: 'Cone de 4,5 m (Destreza)' },
  { key: 'white', labelPt: 'Branco', damageTypePt: 'Frio', breathWeaponPt: 'Cone de 4,5 m (Constituição)' },
];

export function formatDraconicAncestryFeatureName(ancestryKey: string): string | null {
  const ancestry = DRACONIC_ANCESTRIES.find((a) => a.key === ancestryKey);
  if (!ancestry) return null;
  return `Ancestralidade Dracônica: ${ancestry.labelPt} (${ancestry.damageTypePt})`;
}
