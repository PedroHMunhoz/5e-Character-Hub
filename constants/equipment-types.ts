// pt-BR display labels for the `equipmentType` codes used across the PHB's
// classes/backgrounds starting_equipment DSL (see
// data/queries/equipment-lookup.ts's EQUIPMENT_TYPE_FILTERS, which this
// list mirrors 1:1 - confirmed live against every PHB class/background).
export const EQUIPMENT_TYPE_LABELS: Record<string, string> = {
  weaponMartial: 'Arma marcial',
  weaponMartialMelee: 'Arma marcial corpo a corpo',
  weaponSimple: 'Arma simples',
  weaponSimpleMelee: 'Arma simples corpo a corpo',
  instrumentMusical: 'Instrumento musical',
  toolArtisan: 'Ferramentas de artesão',
  focusSpellcastingArcane: 'Foco arcano',
  focusSpellcastingDruidic: 'Foco druídico',
  focusSpellcastingHoly: 'Símbolo sagrado',
};
