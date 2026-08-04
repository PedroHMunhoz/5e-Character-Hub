export interface FeatureUsageOverride {
  usageType: 'ativa' | 'passiva';
  maxUses?: string;
  recovery?: string;
}

// class_features/subclass_features/racial_traits in db/schema.sql don't carry
// usage metadata (active vs. passive, uses per rest) — that's buried in prose
// the import pipeline doesn't parse. Keyed by the feature's English source
// name (stable across tables/re-imports); only the limited-use active
// features need an entry here, everything else defaults to passive.
export const FEATURE_USAGE_OVERRIDES: Record<string, FeatureUsageOverride> = {
  'Arcane Recovery': { usageType: 'ativa', maxUses: '1', recovery: 'DL' },
};
