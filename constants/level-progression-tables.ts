// Level-by-level progression tables for a handful of class features whose
// PHB text just says "as shown in the table" without giving numbers (see
// docs/TODO.md / the conversation that added these). Keyed by the
// raw (English) class_features.name - same stable-key convention as
// OptionalFeatureDefinition.englishName - since these numbers are rule data
// I derived, not translatable book prose, so they don't belong in the
// `translations` table.
//
// Only features with a genuinely tabular (non-linear) progression are
// listed here. Sorcery Points and Ki Points are deliberately left out -
// both are just "equal to your level", and a ~19-row table repeating that
// would be visual noise; they stay as a plain sentence in the feature text.

export interface LevelProgressionTableData {
  // Only needed when a feature has more than one table (Barbarian's Rage:
  // uses per long rest + damage bonus).
  title?: string;
  columns: [string, string];
  rows: [string, string][];
}

export const LEVEL_PROGRESSION_TABLES: Record<string, LevelProgressionTableData[]> = {
  'Sneak Attack': [
    {
      columns: ['Nível', 'Dano'],
      rows: [
        ['1º–2º', '1d6'],
        ['3º–4º', '2d6'],
        ['5º–6º', '3d6'],
        ['7º–8º', '4d6'],
        ['9º–10º', '5d6'],
        ['11º–12º', '6d6'],
        ['13º–14º', '7d6'],
        ['15º–16º', '8d6'],
        ['17º–18º', '9d6'],
        ['19º–20º', '10d6'],
      ],
    },
  ],
  'Martial Arts': [
    {
      columns: ['Nível', 'Dado'],
      rows: [
        ['1º–4º', 'd4'],
        ['5º–10º', 'd6'],
        ['11º–16º', 'd8'],
        ['17º–20º', 'd10'],
      ],
    },
  ],
  'Unarmored Movement': [
    {
      columns: ['Nível', 'Bônus'],
      rows: [
        ['2º–5º', '+3m'],
        ['6º–9º', '+4,5m'],
        ['10º–13º', '+6m'],
        ['14º–17º', '+7,5m'],
        ['18º–20º', '+9m'],
      ],
    },
  ],
  Rage: [
    {
      title: 'Fúrias por Descanso Longo',
      columns: ['Nível', 'Fúrias'],
      rows: [
        ['1º–2º', '2'],
        ['3º–5º', '3'],
        ['6º–11º', '4'],
        ['12º–16º', '5'],
        ['17º–19º', '6'],
        ['20º', 'Ilimitadas'],
      ],
    },
    {
      title: 'Dano de Fúria',
      columns: ['Nível', 'Bônus'],
      rows: [
        ['1º–8º', '+2'],
        ['9º–15º', '+3'],
        ['16º–20º', '+4'],
      ],
    },
  ],
};
