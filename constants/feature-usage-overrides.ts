export type RecoveryType = 'DC' | 'DL';

export interface FeatureUsageOverride {
  usageType: 'ativa' | 'passiva';
  maxUses?: string;
  recovery?: RecoveryType[];
}

export const RECOVERY_LABELS: Record<RecoveryType, string> = {
  DC: 'Descanso Curto',
  DL: 'Descanso Longo',
};

// class_features/subclass_features/racial_traits in db/schema.sql don't carry
// usage metadata (active vs. passive, uses per rest) — that's buried in prose
// the import pipeline doesn't parse. Keyed by the feature's English source
// name (stable across tables/re-imports); only the limited-use active
// features need an entry here, everything else defaults to passive.
export const FEATURE_USAGE_OVERRIDES: Record<string, FeatureUsageOverride> = {
  'Arcane Recovery': { usageType: 'ativa', maxUses: '1', recovery: ['DL'] },
  'Second Wind': { usageType: 'ativa', maxUses: '1', recovery: ['DC', 'DL'] },
};

export function getFeatureUsage(englishName: string): FeatureUsageOverride {
  const override = FEATURE_USAGE_OVERRIDES[englishName];
  return {
    usageType: override?.usageType ?? 'passiva',
    maxUses: override?.maxUses,
    recovery: override?.recovery,
  };
}

// Some features recover on both a short and a long rest - the PHB phrases
// that as "Descanso Curto ou Longo" rather than spelling out "Descanso Longo"
// twice, so special-case the combination instead of just joining labels.
export function formatRecovery(recovery: RecoveryType[] | undefined): string {
  if (!recovery || recovery.length === 0) return '-';
  if (recovery.includes('DC') && recovery.includes('DL')) return 'Descanso Curto ou Longo';
  return recovery.map((code) => RECOVERY_LABELS[code]).join(' ou ');
}
