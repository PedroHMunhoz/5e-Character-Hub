export interface FeatureItemDefinition {
  id: string;
  name: string;
  usageType: 'ativa' | 'passiva';
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
      { id: 'recuperacao-arcana', name: 'Recuperação Arcana', usageType: 'ativa', maxUses: '1', recovery: 'DL' },
      { id: 'tradicao-arcana', name: 'Tradição Arcana', usageType: 'passiva' },
      { id: 'especialista-em-evocacao', name: 'Especialista em Evocação', usageType: 'passiva' },
      { id: 'truque-poderoso', name: 'Truque Poderoso', usageType: 'passiva' },
      { id: 'moldar-magias', name: 'Moldar Magias', usageType: 'passiva' },
      { id: 'conjuracao', name: 'Conjuração', usageType: 'passiva' },
      { id: 'mago', name: 'Mago', usageType: 'passiva' },
    ],
  },
  {
    key: 'racial',
    label: 'Características Raciais',
    items: [
      { id: 'conhecimento-de-artifice', name: 'Conhecimento de Artífice', usageType: 'passiva' },
      { id: 'astucia-gnomica', name: 'Astúcia Gnômica', usageType: 'passiva' },
      { id: 'gnomo-das-rochas', name: 'Gnomo das Rochas', usageType: 'passiva' },
      { id: 'inventividade-racial', name: 'Inventividade', usageType: 'passiva' },
    ],
  },
  {
    key: 'antecedente',
    label: 'Características do Antecedente',
    items: [{ id: 'erudito', name: 'Erudito', usageType: 'passiva' }],
  },
  {
    key: 'outras',
    label: 'Outras Características',
    items: [{ id: 'inventividade-outras', name: 'Inventividade', usageType: 'passiva' }],
  },
];
