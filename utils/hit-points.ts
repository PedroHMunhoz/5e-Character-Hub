export interface HpApplyResult {
  current: string;
  temporary: string;
}

export interface HpOutcome {
  title: string;
  message: string;
}

export type HpApplyResolution =
  { kind: 'invalid'; message: string } | { kind: 'applied'; result: HpApplyResult; outcome: HpOutcome | null };

// PHB p.198 "Damage and Healing": temporary HP absorbs damage before
// current HP; healing can't push current HP above max. PHB p.197 "Instant
// Death": if damage remaining after current HP hits 0 equals or exceeds the
// character's HP maximum, they die instantly instead of just going
// unconscious. `variant: 'temp-only'` (the "add temporary HP" flow) skips
// all of this - temporary HP has no ceiling and never interacts with
// current HP directly.
export function resolveHpApply(
  variant: 'damage-heal' | 'temp-only',
  rawValue: number,
  originalCurrent: number,
  originalTemp: number,
  maxHp: number
): HpApplyResolution {
  if (variant === 'temp-only') {
    return {
      kind: 'applied',
      result: { current: String(originalCurrent), temporary: String(rawValue) },
      outcome: null,
    };
  }

  const startTotal = originalCurrent + originalTemp;
  const ceiling = maxHp + originalTemp;
  if (maxHp > 0 && rawValue > ceiling) {
    return { kind: 'invalid', message: `Esse valor é inválido pois PV Máximo é ${maxHp}.` };
  }

  const netDelta = rawValue - startTotal;
  let outcome: HpOutcome | null = null;
  let newCurrent = originalCurrent;
  let newTemp = originalTemp;

  if (netDelta >= 0) {
    newCurrent = maxHp > 0 ? Math.min(originalCurrent + netDelta, maxHp) : originalCurrent + netDelta;
    newTemp = originalTemp;
  } else {
    const magnitude = -netDelta;
    newTemp = Math.max(originalTemp - magnitude, 0);
    const remaining = Math.max(magnitude - originalTemp, 0);

    if (remaining > 0) {
      const currentAfter = originalCurrent - remaining;
      if (currentAfter <= 0) {
        const overflow = -currentAfter;
        outcome =
          maxHp > 0 && overflow >= maxHp
            ? {
                title: 'Morte por Dano Maciço',
                message:
                  'O dano restante foi igual ou maior que o máximo de pontos de vida do personagem. Ele morreu instantaneamente.',
              }
            : {
                title: 'Inconsciente',
                message: 'Os pontos de vida chegaram a 0. O personagem está inconsciente.',
              };
        newCurrent = 0;
      } else {
        newCurrent = currentAfter;
      }
    } else {
      newCurrent = originalCurrent;
    }
  }

  return { kind: 'applied', result: { current: String(newCurrent), temporary: String(newTemp) }, outcome };
}
