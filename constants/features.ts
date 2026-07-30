export interface FeatureItemDefinition {
  id: string;
  name: string;
  maxUses?: string;
  recovery?: string;
}

export interface FeatureSectionDefinition {
  key: string;
  label: string;
  items: FeatureItemDefinition[];
}

export const FEATURE_SECTIONS: FeatureSectionDefinition[] = [
  {
    key: 'classe',
    label: 'Características de Classe',
    items: [
      { id: 'recuperacao-arcana', name: 'Recuperação Arcana', maxUses: '1', recovery: 'DL' },
      { id: 'tradicao-arcana', name: 'Tradição Arcana' },
      { id: 'especialista-em-evocacao', name: 'Especialista em Evocação' },
      { id: 'truque-poderoso', name: 'Truque Poderoso' },
      { id: 'moldar-magias', name: 'Moldar Magias' },
      { id: 'conjuracao', name: 'Conjuração' },
      { id: 'mago', name: 'Mago' },
    ],
  },
  {
    key: 'racial',
    label: 'Características Raciais',
    items: [
      { id: 'conhecimento-de-artifice', name: 'Conhecimento de Artífice' },
      { id: 'astucia-gnomica', name: 'Astúcia Gnômica' },
      { id: 'gnomo-das-rochas', name: 'Gnomo das Rochas' },
      { id: 'inventividade-racial', name: 'Inventividade' },
    ],
  },
  {
    key: 'antecedente',
    label: 'Características do Antecedente',
    items: [{ id: 'erudito', name: 'Erudito' }],
  },
  {
    key: 'outras',
    label: 'Outras Características',
    items: [{ id: 'inventividade-outras', name: 'Inventividade' }],
  },
];
